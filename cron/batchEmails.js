import { connectDB } from "../src/database/db.js";
import { applyAssociations, Collaborator } from "../src/database/models/index.js";
import MailHistoriesContacts from "../src/database/models/mail-history-contact.model.js";
import MailHistories from "../src/database/models/mail-history.model.js";
import MailAccountModel from "../src/database/models/mail-account.model.js";
import { buildTransporter } from "../src/utils/transporter.js";
import { buildMailBodies, formatEmail } from "../src/utils/email.js";
import ContactModel from "../src/database/models/contact.model.js";

const LIMIT_BATCH_SIZE = 15;

const sendBatchEmails = async ({ batchEmails, content, mailAccount, transporter, object }) => {
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
				// await createdEmailContactHistory.update({ status });
				await MailHistoriesContacts.update({ status }, { where: { id: toEmail.mailHistoryContactId } });
				console.log(`✅ Email envoyé à ${toEmail.email}`);
			} catch (err) {
				// await createdEmailContactHistory.update({ status: "error" });
				await MailHistoriesContacts.update(
					{ status: "error", error: err.message },
					{ where: { id: toEmail.mailHistoryContactId } },
				);
				console.error(`❌ Erreur pour ${toEmail.email}: ${err.message}`);
			}
		}),
	);

	await new Promise((resolve) => setTimeout(resolve, 1000));
};

export const buildCronEmails = async (to) => {
	const toEmails = [];

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
			}
		}
	}
	return toEmails;
};

/*
Content
Email to send
Object
Transporteur
 */
export const getBatchUnsentEmails = async () => {
	const unsentEmail = await MailHistoriesContacts.findOne({ where: { status: "pending" } });
	if (!unsentEmail) return null;
	const mailHistories = await MailHistoriesContacts.findAll({
		where: { status: "pending", mailHistoryId: unsentEmail.mailHistoryId },
		limit: LIMIT_BATCH_SIZE,
	});
	const emailInfo = await MailHistories.findOne({ where: { id: unsentEmail.mailHistoryId } });

	const mailAccount = await MailAccountModel.findByPk(emailInfo.mailAccountId);
	const transporter = buildTransporter(mailAccount);
	const batchEmails = await buildCronEmails(mailHistories);
	await sendBatchEmails({
		batchEmails: batchEmails,
		content: emailInfo.content,
		mailAccount,
		transporter,
		object: emailInfo.object,
	});
	transporter?.close();
	console.log("✅ Tous les e-mails ont été traités.");
	console.log(unsentEmail);
};

export async function startBatchEmails() {
	await connectDB();
	applyAssociations();
	getBatchUnsentEmails();
}
