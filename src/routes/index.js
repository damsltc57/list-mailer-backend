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
	const mailAccount = await MailAccountModel.findByPk(selectedAddress);
	const emailHistory = await MailHistories.create({ content, object, mailAccountId: mailAccount.id });
	const transporter = buildTransporter(mailAccount);

	const attachments = [];

	Object.keys(req?.files).forEach((key) => {
		let file = req.files[key];
		attachments.push({
			filename: file.name,
			content: file.data,
		});
	});

	const emailPromises = to.map(async (toEmail) => {
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
					attachments: attachments,
				},
				async (err, res) => {
					console.log("Hello world");
					await createdEmailContactHistory.update({ status: res?.accepted.length > 0 ? "sent" : "error" });
					resolve(res);
				},
			);
		});
	});

	await Promise.all(emailPromises)
		.then((results) => {
			console.log("All emails sent successfully:");
		})
		.catch((error) => {
			console.error("One or more emails failed to send:");
		});
	transporter?.close();

	res.status(200);
});

export default router;
