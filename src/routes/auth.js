import express from "express";
import bcrypt from "bcrypt";
import User from "../database/models/user.model.js";
import jwt from "jsonwebtoken";
import isAuthenticated from "../middleware/isAuthenticated.js";
const router = express.Router();
import { google } from "googleapis";
import MailAccountModel from "../database/models/mail-account.model.js";

const OAuth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URL,
);

google.options({ auth: OAuth2Client });

const scopes = [
	"https://mail.google.com/",
	"https://www.googleapis.com/auth/userinfo.profile",
	"profile",
	"https://www.googleapis.com/auth/user.emails.read",
];

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
	const token = jwt.sign({ email, userId: user.id }, process.env.JTW_TOKEN, { expiresIn: "30d" });
	delete user.password;
	res.status(200).json({
		token,
		email,
		user,
	});
});

router.get("/me", isAuthenticated, async function (req, res, next) {
	const { id } = req.auth;
	const user = await User.findByPk(id);
	delete user.password;
	res.status(200).json({ user });
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

router.get("/google/oauth", isAuthenticated, async function (req, res, next) {
	const url = OAuth2Client.generateAuthUrl({
		// 'online' (default) or 'offline' (gets refresh_token)
		access_type: "offline",

		// If you only need one scope, you can pass it as a string
		scope: scopes,
	});
	res.status(200).json(url);
});
router.post("/google/register", isAuthenticated, async function (req, res, next) {
	const { code } = req.body;

	const { tokens } = await OAuth2Client.getToken(code);

	const ticket = await OAuth2Client.verifyIdToken({
		idToken: tokens?.id_token,
		audience: process.env.GOOGLE_CLIENT_ID,
	});

	// OAuth2Client.setCredentials({ refresh_token: tokens.refresh_token, access_token: tokens.access_token });

	OAuth2Client.credentials = tokens;

	const payload = ticket.getPayload();
	const userid = payload["sub"];

	const people = google.people("v1");

	const me = await people.people.get({
		resourceName: "people/me",
		personFields: "emailAddresses",
	});
	const email = me.data.emailAddresses[0]?.value;

	const mailAccount = await MailAccountModel.findOne({ where: { googleId: userid } });
	if (!mailAccount) {
		await MailAccountModel.create({
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			googleId: userid,
			userId: req.auth.id,
			email: email,
			expires: tokens.expiry_date,
		});
	} else if (!!tokens.refresh_token && mailAccount) {
		await MailAccountModel.update({ refreshToken: tokens.refresh_token }, { where: { googleId: userid } });
	}

	// const mailAccount = MailAccountModel.create();
	// oauth2Client.setCredentials(tokens);
	res.status(200).json("");
});

export default router;
