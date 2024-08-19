import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailHistories from "../database/models/mail-history.model.js";
const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
	const list = await MailHistories.findAll({ include: { model: Contact, as: "to" } });

	res.status(200).json(list);
});

export default router;
