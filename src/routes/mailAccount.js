import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailAccountModel from "../database/models/mail-account.model.js";
const router = express.Router();

router.get("/list", isAuthenticated, async function (req, res, next) {
	console.log(req);
	const list = await MailAccountModel.findAll({ where: { userId: req.auth.id } });

	res.status(200).json(list);
});

export default router;
