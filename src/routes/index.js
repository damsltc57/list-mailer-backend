import express from "express";
import MailAccountModel from "../database/models/mail-account.model.js";
import { buildTransporter } from "../utils/transporter.js";
import { formatEmail } from "../utils/email.js";
import MailHistories from "../database/models/mail-history.model.js";
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
		console.log(toEmail);
		await emailHistory.addTo(toEmail.id);
		// transporter.sendMail({ from: mailAccount.email, to: toEmail.email, subject: object, text: "", html: content });
	}

	console.log(req);
});

export default router;
