import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailAccountModel from "../database/models/mail-account.model.js";
import { google } from "googleapis";
import { OAuth2Client } from "./auth.js";
const router = express.Router();

google.options({ auth: OAuth2Client });
router.get("/list", isAuthenticated, async function (req, res, next) {
	let list = await MailAccountModel.findAll({ where: { userId: req.auth.id } });

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

export default router;
