import express from "express";
import User from "../database/models/user.model.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
const router = express.Router();

router.post("/create", isAuthenticated, async function (req, res, next) {
	const {
		firstName,
		lastName,
		email,
		companyName,
		tvProducer,
		filmProducer,
		broadcaster,
		distributor,
		formalityLevel,
	} = req.body;
	const contact = await Contact.create({
		firstName,
		lastName,
		email,
		companyName,
		tvProducer,
		filmProducer,
		broadcaster,
		distributor,
		formalityLevel,
	});
	if (!contact) {
		res.status(400).json("Invalid values");
	}
	res.status(200).json({ contact });
});

router.get("/list", isAuthenticated, async function (req, res, next) {
	const list = await Contact.findAll();

	res.status(200).json(list);
});

export default router;
