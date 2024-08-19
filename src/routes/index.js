import express from "express";
import MailAccountModel from "../database/models/mail-account.model.js";
import { buildTransporter } from "../utils/transporter.js";
import { formatEmail } from "../utils/email.js";
import MailHistories from "../database/models/mail-history.model.js";
import MailHistoriesContacts from "../database/models/mail-history-contact.model.js";
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {});

router.post("/send-mail", async function (req, res, next) {
	const { object, selectedAddress, attachments, to, content } = req.body;

	const mailAccount = await MailAccountModel.findByPk(selectedAddress);
	const emailHistory = await MailHistories.create({ content, object, mailAccountId: mailAccount.id });
	const transporter = buildTransporter(mailAccount);
	for (let toEmail of to) {
		const updatedContent = formatEmail(content, toEmail);
		const createdEmailContactHistory = await MailHistoriesContacts.create({
			mailHistoryId: emailHistory.id,
			contactId: toEmail.id,
			status: "sending",
		});
		await new Promise((resolve) => {
			transporter.sendMail(
				{
					from: mailAccount.email,
					to: toEmail.email,
					subject: object,
					text: updatedContent,
					html: updatedContent,
				},
				async (err, res) => {
					console.log("Hello world");
					await createdEmailContactHistory.update({ status: res?.accepted.length > 0 ? "sent" : "error" });
					resolve(res);
				},
			);
		});
	}
	res.status(200);
});

export default router;
