import { connectDB } from "../src/database/db.js";
import { applyAssociations, Collaborator } from "../src/database/models/index.js";
import MailHistoriesContacts from "../src/database/models/mail-history-contact.model.js";
import MailHistories from "../src/database/models/mail-history.model.js";
import MailAccountModel from "../src/database/models/mail-account.model.js";
import GlobalSettings from "../src/database/models/global-setting.model.js";
import CronLog from "../src/database/models/cron-log.model.js";
import { buildTransporter } from "../src/utils/transporter.js";
import { buildMailBodies, formatEmail } from "../src/utils/email.js";
import ContactModel from "../src/database/models/contact.model.js";

const sendBatchEmails = async ({ batchEmails, content, mailAccount, transporter, object }) => {
	let successCount = 0;
	let errorCount = 0;
	const errorDetails = [];

	await Promise.all(
		batchEmails.map(async (toEmail) => {
			const updatedContent = formatEmail(content, toEmail, mailAccount.signature);

			try {
				const result = await transporter.sendMail({
					from: {
						name: mailAccount.emailNickname,
						address: mailAccount.email,
					},
					to: toEmail.email,
					subject: object,
					text: buildMailBodies({ html: updatedContent, htmlToTextOptions: {} }),
					html: updatedContent,
					// attachments: attachments,
				});

				const status = result.accepted.length > 0 ? "sent" : "error";
				await MailHistoriesContacts.update(
					{ status, processedAt: new Date() },
					{ where: { id: toEmail.mailHistoryContactId } },
				);
				if (status === "sent") {
					successCount++;
					console.log(`✅ Email envoyé à ${toEmail.email}`);
				} else {
					errorCount++;
					errorDetails.push(`Erreur d'envoi pour ${toEmail.email}`);
					console.log(`⚠️ Email non accepté pour ${toEmail.email}`);
				}
			} catch (err) {
				await MailHistoriesContacts.update(
					{ status: "error", error: err.message, processedAt: new Date() },
					{ where: { id: toEmail.mailHistoryContactId } },
				);
				errorCount++;
				errorDetails.push(`${toEmail.email}: ${err.message}`);
				console.error(`❌ Erreur pour ${toEmail.email}: ${err.message}`);
			}
		}),
	);

	await new Promise((resolve) => setTimeout(resolve, 1000));

	return { successCount, errorCount, errorDetails };
};

export const buildCronEmails = async (to) => {
	const toEmails = [];
	const missingContactIds = [];

	for (const contact of to) {
		if (!contact?.collaboratorId) {
			const data = await ContactModel.findByPk(contact.contactId);
			if (data) {
				toEmails.push({
					id: data.id,
					email: data.email,
					firstName: data.firstName,
					mailHistoryContactId: contact.id,
				});
			} else {
				missingContactIds.push(contact.id);
			}
		} else {
			const collaborator = await Collaborator.findByPk(contact.collaboratorId);
			if (!!collaborator) {
				toEmails.push({
					id: collaborator.id,
					email: collaborator.email,
					firstName: collaborator.firstName,
					collaboratorId: collaborator.id,
					mailHistoryContactId: contact.id,
				});
			} else {
				missingContactIds.push(contact.id);
			}
		}
	}
	return { toEmails, missingContactIds };
};

/*
Content
Email to send
Object
Transporteur
 */
export const getBatchUnsentEmails = async () => {
	let limitBatchSize = 5;
	try {
		const settings = await GlobalSettings.findOne();
		if (settings) {
			if (settings.isPaused) {
				console.log("⏸️ L'envoi de masse est en pause.");
				await CronLog.create({
					cronName: "batchEmails",
					status: "warning",
					summary: "Envoi mis en pause",
					details: JSON.stringify(["Le système a été mis en pause manuellement."]),
					timestamp: new Date(),
				});
				return;
			}
			limitBatchSize = settings.batchLimit || 5;
		}
	} catch (err) {
		console.error("Failed to load global settings", err);
	}

	const unsentEmail = await MailHistoriesContacts.findOne({ where: { status: "pending" } });
	if (!unsentEmail) return null;
	const mailHistories = await MailHistoriesContacts.findAll({
		where: { status: "pending", mailHistoryId: unsentEmail.mailHistoryId },
		limit: limitBatchSize,
	});
	const emailInfo = await MailHistories.findOne({ where: { id: unsentEmail.mailHistoryId } });

	const mailAccount = await MailAccountModel.findByPk(emailInfo.mailAccountId);
	const transporter = buildTransporter(mailAccount);
	const { toEmails: batchEmails, missingContactIds } = await buildCronEmails(mailHistories);
	try {
		let totalErrorCount = 0;
		const allErrorDetails = [];

		if (missingContactIds.length > 0) {
			await MailHistoriesContacts.update(
				{ status: "error", error: "Contact ou collaborateur introuvable (supprimé)", processedAt: new Date() },
				{ where: { id: missingContactIds } }
			);
			totalErrorCount += missingContactIds.length;
			allErrorDetails.push(`${missingContactIds.length} contact(s) ignoré(s) car introuvable(s) en base`);
		}

		let successCount = 0;
		if (batchEmails.length > 0) {
			const batchResult = await sendBatchEmails({
				batchEmails: batchEmails,
				content: emailInfo.content,
				mailAccount,
				transporter,
				object: emailInfo.object,
			});
			successCount = batchResult.successCount;
			totalErrorCount += batchResult.errorCount;
			if (batchResult.errorDetails.length > 0) {
				allErrorDetails.push(...batchResult.errorDetails);
			}
		}

		let status = "success";
		let summary = `${successCount} email(s) envoyé(s)`;
		if (totalErrorCount > 0) {
			status = successCount === 0 ? "error" : "warning";
			summary += `, ${totalErrorCount} erreur(s)`;
		}

		await CronLog.create({
			cronName: "batchEmails",
			status,
			summary,
			details: allErrorDetails.length ? JSON.stringify(allErrorDetails) : null,
			timestamp: new Date(),
		});
	} catch (e) {
		console.log(e);
		await CronLog.create({
			cronName: "batchEmails",
			status: "error",
			summary: "Erreur globale d'exécution",
			details: JSON.stringify([e.message || "Erreur inconnue"]),
			timestamp: new Date(),
		});
	} finally {
		transporter?.close();
	}
};

export async function startBatchEmails() {
	await connectDB();
	applyAssociations();
	getBatchUnsentEmails();
}
