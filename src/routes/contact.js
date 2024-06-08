import express from "express";
import User from "../database/models/user.model.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
const router = express.Router();
import XLSX from "xlsx";

router.post("/create", isAuthenticated, async function (req, res, next) {
	const args = req.body;
	const contact = await Contact.create({
		...args,
	});
	if (!contact) {
		res.status(400).json("Invalid values");
	}
	res.status(200).json({ contact });
});

router.post("/update", isAuthenticated, async function (req, res, next) {
	const { id, ...args } = req.body;

	const contact = await Contact.update(
		{
			...args,
		},
		{ where: { id } },
	);
	if (!contact) {
		res.status(400).json("Invalid values");
	}
	res.status(200).json({ contact });
});

router.get("/list", isAuthenticated, async function (req, res, next) {
	const list = await Contact.findAll({ order: [["createdAt", "DESC"]] });

	res.status(200).json(list);
});

router.post("/import", isAuthenticated, async function (req, res, next) {
	if (!req?.files?.file?.data) {
		res.status(404);
		return;
	}
	const wb = XLSX.read(req.files.file.data, { type: "buffer" });
	const sheet = wb.Sheets[wb.SheetNames[0]];
	const json = XLSX.utils.sheet_to_json(sheet, { header: 0 });
	res.status(200);
});

export default router;
