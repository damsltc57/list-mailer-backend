import express from "express";
import MailAccountModel from "../database/models/mail-account.model.js";
import { buildTransporter } from "../utils/transporter.js";
import { formatEmail } from "../utils/email.js";
import MailHistories from "../database/models/mail-history.model.js";
import MailHistoriesContacts from "../database/models/mail-history-contact.model.js";
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
	return res.status(200).json("Hello world");
});

router.post("/send-mail", async function (req, res, next) {
	const { object, selectedAddress, to: toString, content } = req.body;
	const to = JSON.parse(toString);
	const attachments = [];

	res.sendStatus(200);

	void (async () => {
		try {
			const mailAccount = await MailAccountModel.findByPk(selectedAddress);
			const emailHistory = await MailHistories.create({ content, object, mailAccountId: mailAccount.id });
			const transporter = buildTransporter(mailAccount);

			if (req.files) {
				Object.keys(req.files).forEach((key) => {
					let file = req.files[key];
					attachments.push({
						filename: file.name,
						content: file.data,
					});
				});
			}

			const chunkArray = (array, size) => {
				const result = [];
				for (let i = 0; i < array.length; i += size) {
					result.push(array.slice(i, i + size));
				}
				return result;
			};

			const batches = chunkArray(to, 20);
			for (const batch of batches) {
				await Promise.all(
					batch.map(async (toEmail) => {
						const updatedContent = formatEmail(content, toEmail);
						const createdEmailContactHistory = await MailHistoriesContacts.create({
							mailHistoryId: emailHistory.id,
							contactId: toEmail.id,
							status: "sending",
						});

						try {
							const result = await transporter.sendMail({
								from: mailAccount.email,
								to: toEmail.email,
								subject: object,
								text: updatedContent,
								html: updatedContent,
								attachments: attachments,
							});

							const status = result.accepted.length > 0 ? "sent" : "error";
							await createdEmailContactHistory.update({ status });
							console.log(`✅ Email envoyé à ${toEmail.email}`);
						} catch (err) {
							await createdEmailContactHistory.update({ status: "error" });
							console.error(`❌ Erreur pour ${toEmail.email}: ${err.message}`);
						}
					}),
				);

				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			transporter?.close();
			console.log("✅ Tous les e-mails ont été traités.");
		} catch (err) {
			console.error("❌ Erreur dans le traitement de fond :", err.message);
		}
	})();
});

export default router;
