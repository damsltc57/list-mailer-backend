import { google } from "googleapis";
import fs from "fs/promises";
import ContactList from "../src/database/models/contact-list.model.js";
import Contact from "../src/database/models/contact.model.js";
import cron from "node-cron";
import sequelize from "../src/database/models/index.js";

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const formalityMap = {
	VOUS: "formal",
	TU: "informal",
};

async function getAllSheetsData() {
	const keyFile = await fs.readFile("./keys.json", "utf-8");
	const keys = JSON.parse(keyFile);
	const auth = new google.auth.GoogleAuth({
		credentials: keys,
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});

	const sheetsApi = google.sheets({ version: "v4", auth });
	const spreadsheetId = process.env.SPREAD_SHEET_ID;
	try {
		const metadata = await sheetsApi.spreadsheets.get({
			spreadsheetId: spreadsheetId,
		});

		const sheetTitles = metadata.data.sheets.map((sheet) => sheet.properties.title);

		for (const title of sheetTitles) {
			const res = await sheetsApi.spreadsheets.values.get({
				spreadsheetId: spreadsheetId,
				range: title,
			});

			const values = res.data.values || [];
			const [headers, ...rows] = values;

			const data = rows.map((row) => {
				const obj = {};
				headers.forEach((header, i) => {
					obj[header] = row[i] || null;
				});
				return obj;
			});

			await saveContactsToDB(data, title);
			await wait(2000);
		}
	} catch (error) {
		console.error(error);
	}
}

async function saveContactsToDB(contacts, sheetName) {
	let contactList = await ContactList.findOne({ where: { name: sheetName } });
	if (!contactList) {
		contactList = await ContactList.create({ name: sheetName });
	}

	// 1. Récupère tous les contacts existants de la liste
	const existingContacts = await Contact.findAll({
		where: { contactListId: contactList.id },
		raw: true,
	});

	const existingEmailMap = new Map();
	existingContacts.forEach((contact) => {
		existingEmailMap.set(contact.email, contact);
	});

	// 2. Prépare les données du Sheet dans une Map par email
	const sheetEmailMap = new Map();
	contacts.forEach((c) => {
		if (c.email_company) {
			sheetEmailMap.set(c.email_company, c);
		}
	});

	// 3. Détecter les ajouts, mises à jour et suppressions
	const contactsToInsert = [];
	const contactsToUpdate = [];
	const emailsInSheet = new Set(sheetEmailMap.keys());

	for (const [email, contactSheet] of sheetEmailMap.entries()) {
		const existing = existingEmailMap.get(email);

		const newData = {
			firstName: contactSheet.first_name || "",
			lastName: contactSheet.last_name || "",
			email: contactSheet.email_company,
			companyName: contactSheet.company || null,
			formalityLevel: formalityMap[contactSheet?.["VOUS ou TU"]] || "",
			interesting: contactSheet?.["INTERESSANT ?"] === "OUI",
			country: contactSheet.country || null,
			website: contactSheet?.website_company || null,
			tvProducer: contactSheet?.["Film_TV"]?.includes("TV") || false,
			filmProducer: contactSheet?.["Film_TV"]?.includes("Film") || false,
			contactListId: contactList.id,
			userId: null,
		};

		if (!existing) {
			contactsToInsert.push(newData);
		} else {
			// Compare champs pour voir si modification nécessaire
			const isChanged = Object.entries(newData).some(([key, value]) => existing[key] !== value);
			if (isChanged) {
				newData.id = existing.id;
				contactsToUpdate.push(newData);
			}
		}
	}

	// 4. Détecter les suppressions (emails existants qui ne sont plus dans le Sheet)
	const emailsToDelete = existingContacts.filter((c) => !emailsInSheet.has(c.email)).map((c) => c.id);

	// 5. Effectuer les opérations
	if (contactsToInsert.length > 0) {
		await Contact.bulkCreate(contactsToInsert);
		console.log(`✅ Ajouté ${contactsToInsert.length} nouveaux contacts dans "${sheetName}"`);
	}

	if (contactsToUpdate.length > 0) {
		for (const contact of contactsToUpdate) {
			const { id, ...updateFields } = contact;
			await Contact.update(updateFields, { where: { id } });
		}
		console.log(`♻️ Mis à jour ${contactsToUpdate.length} contacts dans "${sheetName}"`);
	}

	if (emailsToDelete.length > 0) {
		await Contact.destroy({ where: { id: emailsToDelete } });
		console.log(`🗑️ Supprimé ${emailsToDelete.length} contacts obsolètes dans "${sheetName}"`);
	}

	if (contactsToInsert.length === 0 && contactsToUpdate.length === 0 && emailsToDelete.length === 0) {
		console.log(`ℹ️ Liste "${sheetName}" déjà à jour, aucune modification`);
	}
}

export async function updateContacts() {
	await sequelize;
	await getAllSheetsData();
}

// cron.schedule("0 0 */1 * *", async () => {
// 	console.log("⏱️ Cron lancé : mise à jour des contacts");
// 	await updateContacts();
// });
