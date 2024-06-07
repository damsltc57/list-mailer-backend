import express from "express";
import bcrypt from "bcrypt";
import User from "../database/models/user.model.js";
import jwt from "jsonwebtoken";
const router = express.Router();

/* GET users listing. */
router.post("/login", async function (req, res, next) {
	const { email, password } = req.body;

	if (!email || !password) {
		res.status(400).json("Invalid params");
		return;
	}

	const user = await User.findOne({ where: { email } });

	const isValidPassword = bcrypt.compareSync(password, user.password);
	if (!isValidPassword) {
		res.status(500).json("Forbidden");
	}
	const token = jwt.sign({ email, userId: user.id }, process.env.JTW_TOKEN, { expiresIn: "1M" });
	res.status(200).json({ token, email, firstName: user.firstName, lastName: user.lastName });
});

router.post("/register", async function (req, res, next) {
	console.log(req);
	const { firstName, lastName, email, password } = req.body;
	if (!firstName || !lastName || !email || !password) {
		res.status(400).json("Invalid params");
		return;
	}
	const user = await User.create({ firstName, lastName, email, password });
	res.send(user);
});

export default router;
