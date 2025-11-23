import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailHistories from "../database/models/mail-history.model.js";
import MailHistoriesContacts from "../database/models/mail-history-contact.model.js";
import MailAccount from "./mailAccount.js";
import MailAccounts from "../database/models/mail-account.model.js";
const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
	const list = await MailHistories.findAll({ order: [["createdAt", "DESC"]] });

	res.status(200).json(list);
});

router.get("/batch/infos", isAuthenticated, async function (req, res, next) {
	const batchId = req.query.batchId;
	const list = await MailHistoriesContacts.findAndCountAll({ where: { mailHistoryId: batchId } });
	const pending = await MailHistoriesContacts.count({ where: { mailHistoryId: batchId, status: "pending" } });
	const sent = await MailHistoriesContacts.count({ where: { mailHistoryId: batchId, status: "sent" } });
	const error = await MailHistoriesContacts.count({ where: { mailHistoryId: batchId, status: "error" } });
	const mailHistory = await MailHistories.findByPk(batchId);
	const mailAccount = await MailAccounts.findByPk(mailHistory.mailAccountId, { attributes: ["email"] });
	res.status(200).json({ list: list.rows, pending, sent, error, total: list.count, mailAccount });
});

export default router;
