import { google } from "googleapis";
import fs from "fs/promises";
import ContactList from "../src/database/models/contact-list.model.js";
import Contact from "../src/database/models/contact.model.js";
import { applyAssociations, Collaborator } from "../src/database/models/index.js";
import { connectDB } from "../src/database/db.js";
import { diffCollaborators, getCollaborators } from "./utils.js";

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

	// 1) Récupérer tous les contacts existants de la liste AVEC leurs Collaborators
	const existingContacts = await Contact.findAll({
		where: { contactListId: contactList.id },
		include: [
			{
				model: Collaborator,
				as: "collaborators", // alias conservé en Maj
				attributes: ["id", "email", "firstName", "lastName", "phone", "position", "linkedin"],
			},
		],
	});

	// Map email -> contact (plain object)
	const existingEmailMap = new Map();
	existingContacts.forEach((contact) => {
		existingEmailMap.set(contact.email, contact.get({ plain: true }));
	});

	// 2) Préparer les données du Sheet dans une Map par email
	const sheetEmailMap = new Map();
	contacts.forEach((c) => {
		if (c?.email_company ?? c?.["Email Company"]) {
			sheetEmailMap.set(c?.email_company ?? c?.["Email Company"], c);
		}
	});

	// 3) Détecter les ajouts, mises à jour et suppressions
	const contactsToInsert = [];
	const contactsToUpdate = [];
	const emailsInSheet = new Set(sheetEmailMap.keys());

	// Champs "de base" à comparer (hors Collaborators)
	const BASE_FIELDS = [
		"firstName",
		"lastName",
		"email",
		"companyName",
		"formalityLevel",
		"interesting",
		"country",
		"website",
		"tvProducer",
		"filmProducer",
		"contactListId",
		"position",
		"userId",
		"broadcaster",
		"distributor",
		"producer",
	];

	for (const [email, contactSheet] of sheetEmailMap.entries()) {
		const existing = existingEmailMap.get(email);

		const newData = {
			firstName: contactSheet?.[`First Name`] || "",
			lastName: contactSheet?.[`Last Name`] || "",
			email: contactSheet?.email_company ?? contactSheet?.["Email Company"],
			companyName: contactSheet?.["Company"] || null,
			formalityLevel: formalityMap[contactSheet?.["VOUS ou TU"]] || "",
			interesting: contactSheet?.["INTERESSANT"] === "OUI",
			country: contactSheet?.["Country"] || null,
			position: contactSheet?.["Position"] || null,
			website: contactSheet?.["Website"] || null,
			tvProducer: contactSheet?.["Film_TV"]?.includes("TV") || false,
			filmProducer: contactSheet?.["Film_TV"]?.includes("Film") || false,
			contactListId: contactList.id,
			collaborators: await getCollaborators(contactSheet),
			userId: null,
			broadcaster: contactSheet?.["Role Company"]?.includes("Broadcaster") || false,
			distributor: contactSheet?.["Role Company"]?.includes("Distribution") || false,
			producer: contactSheet?.["Role Company"]?.includes("Production") || false,
		};

		if (!existing) {
			// Contact inexistant → on insère (avec ses Collaborators d'entrée de jeu)
			contactsToInsert.push(newData);
		} else {
			// 1) comparer champs de base
			const baseChanged = BASE_FIELDS.some((k) => (existing[k] ?? null) !== (newData[k] ?? null));

			// 2) comparer collaborateurs (existing.Collaborators peut être undefined)
			const { toCreate, toUpdate, toDelete } = diffCollaborators(
				existing.collaborators || [],
				newData.collaborators || [],
			);

			const collabsChanged = toCreate.length > 0 || toUpdate.length > 0 || toDelete.length > 0;

			if (baseChanged || collabsChanged) {
				newData.id = existing.id;
				// On stocke aussi le diff pour appliquer ensuite
				newData._collabDiff = { toCreate, toUpdate, toDelete };
				contactsToUpdate.push(newData);
			}
		}
	}

	// 4) Détecter les suppressions de contacts (emails existants qui ne sont plus dans le Sheet)
	const emailsToDelete = existingContacts.filter((c) => !emailsInSheet.has(c.email)).map((c) => c.id);

	// 5) Effectuer les opérations

	// INSERTS : on utilise create avec include et alias exact
	if (contactsToInsert.length > 0) {
		for (const contactToInsert of contactsToInsert) {
			await Contact.create(contactToInsert, {
				include: [{ model: Collaborator, as: "collaborators" }],
			});
		}
		console.log(`✅ Ajouté ${contactsToInsert.length} nouveaux contacts dans "${sheetName}"`);
	}

	// UPDATES : base + collaborateurs (create/update/delete)
	if (contactsToUpdate.length > 0) {
		for (const contact of contactsToUpdate) {
			const { id, _collabDiff, collaborators: nextCollabs, ...updateFields } = contact;

			// maj des champs de base
			await Contact.update(updateFields, { where: { id } });

			// appliquer le diff collaborateurs
			if (_collabDiff) {
				const { toCreate, toUpdate, toDelete } = _collabDiff;

				// CREATE
				if (toCreate.length) {
					const rows = toCreate.map((c) => ({
						...c,
						contactId: id, // FK
					}));
					await Collaborator.bulkCreate(rows);
				}

				// UPDATE
				for (const c of toUpdate) {
					if (!c.id) continue; // sécurité
					const { id: collabId, ...fields } = c;
					await Collaborator.update(fields, { where: { id: collabId } });
				}

				// DELETE
				if (toDelete.length) {
					const ids = toDelete.map((c) => c.id).filter(Boolean);
					if (ids.length) {
						await Collaborator.destroy({ where: { id: ids } });
					}
				}
			}
		}
		console.log(`♻️ Mis à jour ${contactsToUpdate.length} contacts dans "${sheetName}"`);
	}

	// DELETES : contacts
	if (emailsToDelete.length > 0) {
		// Les Collaborators devraient être supprimés par CASCADE si défini, sinon gérer ici.
		await Contact.destroy({ where: { id: emailsToDelete } });
		console.log(`🗑️ Supprimé ${emailsToDelete.length} contacts obsolètes dans "${sheetName}"`);
	}

	if (contactsToInsert.length === 0 && contactsToUpdate.length === 0 && emailsToDelete.length === 0) {
		console.log(`ℹ️ Liste "${sheetName}" déjà à jour, aucune modification`);
	}
}

export async function updateContacts() {
	await connectDB();
	applyAssociations();
	await getAllSheetsData();
}
// cron.schedule("0 0 */1 * *", async () => {
// 	console.log("⏱️ Cron lancé : mise à jour des contacts");
// 	await updateContacts();
// });
