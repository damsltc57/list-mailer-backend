import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
import express from "express";
import MailHistories from "../database/models/mail-history.model.js";
import MailHistoriesContacts from "../database/models/mail-history-contact.model.js";
import MailAccount from "./mailAccount.js";
import MailAccounts from "../database/models/mail-account.model.js";
import { Op } from "sequelize";
import { sequelize } from "../database/models/index.js";
const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
	const list = await MailHistories.findAll({ order: [["createdAt", "DESC"]] });

	if (list.length === 0) {
		return res.status(200).json(list);
	}

	const listIds = list.map((l) => l.id);
	const duplicates = await MailHistoriesContacts.findAll({
		where: { mailHistoryId: { [Op.in]: listIds } },
		attributes: ["mailHistoryId"],
		group: ["mailHistoryId", "email"],
		having: sequelize.where(sequelize.fn("COUNT", sequelize.col("email")), ">", 1),
	});

	const historyIdsWithDuplicates = new Set(duplicates.map((d) => d.mailHistoryId));

	const statusCounts = await MailHistoriesContacts.findAll({
		where: { mailHistoryId: { [Op.in]: listIds } },
		attributes: ["mailHistoryId", "status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
		group: ["mailHistoryId", "status"],
	});

	const statusMap = {};
	for (const sc of statusCounts) {
		const mhId = sc.mailHistoryId;
		if (!statusMap[mhId]) statusMap[mhId] = { pending: 0, sent: 0, error: 0 };
		statusMap[mhId][sc.status] = parseInt(sc.get("count"), 10);
	}

	const formattedList = list.map((item) => {
		const data = item.toJSON();
		data.hasDuplicates = historyIdsWithDuplicates.has(data.id);

		const counts = statusMap[data.id] || { pending: 0, sent: 0, error: 0 };
		let campaignStatus = "ARCHIVÉE";
		if (counts.pending > 0) {
			if (counts.sent > 0 || counts.error > 0) {
				campaignStatus = "EN COURS";
			} else {
				campaignStatus = "EN ATTENTE";
			}
		}
		data.campaignStatus = campaignStatus;

		return data;
	});

	res.status(200).json(formattedList);
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

		const list = await MailHistories.findAll({
			where: {
				id: {
					[Op.in]: inProgressIds,
				},
			},
			order: [["createdAt", "DESC"]],
		});

		const statusCounts = await MailHistoriesContacts.findAll({
			where: { mailHistoryId: { [Op.in]: inProgressIds } },
			attributes: ["mailHistoryId", "status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
			group: ["mailHistoryId", "status"],
		});

		const statusMap = {};
		for (const sc of statusCounts) {
			const mhId = sc.mailHistoryId;
			if (!statusMap[mhId]) statusMap[mhId] = { pending: 0, sent: 0, error: 0 };
			statusMap[mhId][sc.status] = parseInt(sc.get("count"), 10);
		}

		const formattedList = list.map((item) => {
			const data = item.toJSON();

			const counts = statusMap[data.id] || { pending: 0, sent: 0, error: 0 };
			let campaignStatus = "ARCHIVÉE";
			if (counts.pending > 0) {
				if (counts.sent > 0 || counts.error > 0) {
					campaignStatus = "EN COURS";
				} else {
					campaignStatus = "EN ATTENTE";
				}
			}
			data.campaignStatus = campaignStatus;

			return data;
		});

		res.status(200).json(formattedList);
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

	const duplicates = await MailHistoriesContacts.findAll({
		where: { mailHistoryId: batchId },
		attributes: ["email"],
		group: ["email"],
		having: sequelize.where(sequelize.fn("COUNT", sequelize.col("email")), ">", 1),
	});
	const hasDuplicates = duplicates.length > 0;

	res.status(200).json({ list: list.rows, pending, sent, error, total: list.count, mailAccount, hasDuplicates });
});

router.get("/contacts-by-status", isAuthenticated, async function (req, res, next) {
	try {
		const { status } = req.query;
		let page = parseInt(req.query.page) || 1;
		let limit = parseInt(req.query.limit) || 500;

		if (!status) {
			return res.status(400).json({ error: "Status parameter is required" });
		}

		const offset = (page - 1) * limit;

		const { count, rows } = await MailHistoriesContacts.findAndCountAll({
			where: { status },
			order: [["updatedAt", "DESC"], ["id", "DESC"]],
			limit,
			offset,
		});

		res.status(200).json({ data: rows, total: count });
	} catch (error) {
		console.error("Error fetching contacts by status:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.delete("/batch/:batchId/duplicates", isAuthenticated, async function (req, res, next) {
	try {
		const { batchId } = req.params;

		const contacts = await MailHistoriesContacts.findAll({
			where: { mailHistoryId: batchId },
		});

		const emailMap = new Map();
		for (const contact of contacts) {
			if (!emailMap.has(contact.email)) {
				emailMap.set(contact.email, []);
			}
			emailMap.get(contact.email).push(contact);
		}

		const idsToDelete = [];
		for (const [email, userContacts] of emailMap.entries()) {
			if (userContacts.length > 1) {
				// Priority: sent = 1, error = 2, pending = 3
				userContacts.sort((a, b) => {
					const getPriority = (status) => {
						if (status === "sent") return 1;
						if (status === "error") return 2;
						return 3;
					};
					const priorityA = getPriority(a.status);
					const priorityB = getPriority(b.status);

					if (priorityA !== priorityB) {
						return priorityA - priorityB;
					}
					// If same status, keep the oldest one (lowest ID)
					return a.id - b.id;
				});

				// Keep the first one (index 0), mark the rest for deletion
				for (let i = 1; i < userContacts.length; i++) {
					idsToDelete.push(userContacts[i].id);
				}
			}
		}

		if (idsToDelete.length > 0) {
			await MailHistoriesContacts.destroy({
				where: { id: { [Op.in]: idsToDelete } },
			});
		}

		res.status(200).json({ success: true, deletedCount: idsToDelete.length });
	} catch (error) {
		console.error("Error removing duplicates:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
