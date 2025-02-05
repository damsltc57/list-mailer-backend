import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailAccountModel from "../database/models/mail-account.model.js";
import { google } from "googleapis";
import { OAuth2Client } from "./auth.js";
import { buildTransporter } from "../utils/transporter.js";
const router = express.Router();

google.options({ auth: OAuth2Client });

router.get("/list", isAuthenticated, async function (req, res, next) {
	let list = await MailAccountModel.findAll({ where: { userId: req.auth.id }, order: [["createdAt", "DESC"]] });

	for (let email of list) {
		if (email?.googleId) {
			try {
				OAuth2Client.setCredentials({ refresh_token: email.refreshToken, access_token: email.accessToken });
				const peopleService = google.people({ version: "v1", auth: OAuth2Client });

				// Tenter d'obtenir des informations sur le profil de la personne
				const profile = await peopleService.people.get({
					resourceName: "people/me",
					personFields: "names,emailAddresses",
				});
			} catch (e) {
				console.warn("Outdated credentials");
				try {
					const newTokens = await OAuth2Client.refreshAccessToken();
					OAuth2Client.setCredentials(newTokens.credentials);
				} catch (e) {
					await MailAccountModel.destroy({ where: { id: email.id } });
					list = await MailAccountModel.findAll({ where: { userId: req.auth.id } });
				}
			}
		}
	}

	res.status(200).json(list);
});

router.get("/test/:addressId", isAuthenticated, async function (req, res, next) {
	const { addressId } = req.params;
	const mailAccount = await MailAccountModel.findByPk(addressId);

	const transporter = buildTransporter(mailAccount);
	transporter.verify(function (error, success) {
		if (error) {
			res.status(200).json(error);
		} else {
			res.status(200).json(true);
		}
	});
});

router.patch("/update/:addressId", isAuthenticated, async function (req, res, next) {
	const { addressId } = req.params;
	const { ...args } = req.body;
	const mailAccount = await MailAccountModel.findByPk(addressId);

	if (!mailAccount) {
		return res.status(400).json("Invalid values");
	}

	const contact = await MailAccountModel.update(
		{
			...args,
		},
		{ where: { id: addressId } },
	);
	if (!contact) {
		res.status(400).json("Invalid values");
	}
	res.status(200).json({ contact });
});
router.post("/create", isAuthenticated, async function (req, res, next) {
	const { ...args } = req.body;

	const emailAddress = await MailAccountModel.create({
		...args,
		userId: req.auth.id,
	});

	if (!emailAddress) {
		res.status(400).json("Invalid values");
	}
	res.status(200).json({ emailAddress });
});

export default router;
