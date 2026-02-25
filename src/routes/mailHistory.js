import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailHistories from "../database/models/mail-history.model.js";
import MailHistoriesContacts from "../database/models/mail-history-contact.model.js";
import MailAccount from "./mailAccount.js";
import MailAccounts from "../database/models/mail-account.model.js";
import { Op } from "sequelize";
const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
	const list = await MailHistories.findAll({ order: [["createdAt", "DESC"]] });

	res.status(200).json(list);
});

router.get("/in-progress", isAuthenticated, async function (req, res, next) {
	try {
		// Find all mailHistoryIds that have pending contacts
		const pendingContacts = await MailHistoriesContacts.findAll({
			attributes: ["mailHistoryId"],
			where: { status: "pending" },
			group: ["mailHistoryId"],
		});

		const inProgressIds = pendingContacts.map((contact) => contact.mailHistoryId);

		if (inProgressIds.length === 0) {
			return res.status(200).json([]);
		}

		// Find the actual MailHistories for these IDs
		const list = await MailHistories.findAll({
			where: {
				id: {
					[Op.in]: inProgressIds,
				},
			},
			order: [["createdAt", "DESC"]],
		});

		res.status(200).json(list);
	} catch (error) {
		console.error("Error fetching in-progress mail histories:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/stats", isAuthenticated, async function (req, res, next) {
	try {
		const { startDate, endDate } = req.query;

		// 1. Find all campaigns currently in progress (have "pending" contacts)
		const pendingContacts = await MailHistoriesContacts.findAll({
			attributes: ["mailHistoryId"],
			where: { status: "pending" },
			group: ["mailHistoryId"],
		});

		const inProgressIds = pendingContacts.map((contact) => contact.mailHistoryId);
		const inProgressCount = inProgressIds.length;

		// 2. Count completed campaigns (those not in progress)
		const completedWhere = {
			id: {
				[Op.notIn]: inProgressIds, // Exclude in-progress ones
			},
		};

		// 3. Apply date filter if provided for Campaigns
		const contactsWhere = {};
		if (startDate || endDate) {
			completedWhere.createdAt = {};
			contactsWhere.createdAt = {};
			if (startDate) {
				completedWhere.createdAt[Op.gte] = new Date(startDate);
				contactsWhere.createdAt[Op.gte] = new Date(startDate);
			}
			if (endDate) {
				completedWhere.createdAt[Op.lte] = new Date(endDate);
				contactsWhere.createdAt[Op.lte] = new Date(endDate);
			}
		}

		const completedCount = await MailHistories.count({
			where: completedWhere,
		});

		// 4. Calculate MailHistoriesContacts detailed stats
		const totalEmails = await MailHistoriesContacts.count({ where: contactsWhere });
		const pendingEmails = await MailHistoriesContacts.count({ where: { ...contactsWhere, status: "pending" } });
		const sentEmails = await MailHistoriesContacts.count({ where: { ...contactsWhere, status: "sent" } });
		const errorEmails = await MailHistoriesContacts.count({ where: { ...contactsWhere, status: "error" } });

		res.status(200).json({
			inProgress: inProgressCount,
			completed: completedCount,
			totalEmails,
			pendingEmails,
			sentEmails,
			errorEmails,
		});
	} catch (error) {
		console.error("Error fetching mail history stats:", error);
		res.status(500).json({ error: "Internal server error" });
	}
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

router.get("/contacts-by-status", isAuthenticated, async function (req, res, next) {
	try {
		const { status } = req.query;

		if (!status) {
			return res.status(400).json({ error: "Status parameter is required" });
		}

		const contacts = await MailHistoriesContacts.findAll({
			where: { status },
			order: [["id", "DESC"]],
		});

		res.status(200).json(contacts);
	} catch (error) {
		console.error("Error fetching contacts by status:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
