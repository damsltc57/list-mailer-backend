import express from "express";
import User from "../database/models/user.model.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import Contact from "../database/models/contact.model.js";
const router = express.Router();
import XLSX from "xlsx";
import { Op } from "sequelize";
import { buildContactModel } from "../helpers/contactHelper.js";
import ContactList from "../database/models/contact-list.model.js";
import contactList from "nodemailer/lib/smtp-connection/index.js";
import { Collaborator } from "../database/models/index.js";

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

router.get("/list/:listId?", isAuthenticated, async function (req, res, next) {
	const listId = parseInt(req.params.listId);
	const list = await Contact.findAll({
		order: [["companyName", "ASC"]],
		where: { [Op.or]: [{ userId: req.auth.id }, { userId: null }], ...(!!listId ? { contactListId: listId } : {}) },
	});

	res.status(200).json(list);
});
router.get("/find", isAuthenticated, async function (req, res, next) {
	const { categoryValue, formalityLevel, interesting, country, query, listId } = req.query;
	let queryWhere = {};
	if (formalityLevel) {
		queryWhere.formalityLevel = formalityLevel;
	}
	if (parseInt(listId)) {
		queryWhere.contactListId = parseInt(listId);
	}
	if (country) {
		queryWhere.country = country;
	}
	if (categoryValue.includes("tvProducer")) {
		queryWhere.tvProducer = true;
	}
	if (categoryValue.includes("filmProducer")) {
		queryWhere.filmProducer = true;
	}
	if (categoryValue.includes("broadcaster")) {
		queryWhere.broadcaster = true;
	}
	if (categoryValue.includes("distributor")) {
		queryWhere.distributor = true;
	}
	if (query) {
		queryWhere = {
			...queryWhere,
			[Op.or]: [
				{
					firstName: {
						[Op.iLike]: `%${query}%`,
					},
				},
				{
					lastName: {
						[Op.iLike]: `%${query}%`,
					},
				},
				{
					companyName: {
						[Op.iLike]: `%${query}%`,
					},
				},
				{
					email: {
						[Op.iLike]: `%${query}%`,
					},
				},
			],
		};
	}
	const list = await Contact.findAll({
		order: [["createdAt", "DESC"]],
		where: { ...queryWhere },
		include: [{ model: Collaborator, as: "collaborators" }],
	});

	res.status(200).json(list);
});

router.get("/ids", isAuthenticated, async function (req, res, next) {
	const { ids } = req.query;
	const idList = ids.split(",").map(Number);
	const list = await Contact.findAll({
		order: [["createdAt", "DESC"]],
		where: {
			id: { [Op.in]: idList },
		},
	});
	res.status(200).json(list);
});

router.post("/import", isAuthenticated, async function (req, res, next) {
	if (!req?.files?.file?.data) {
		res.status(404);
		return;
	}
	const { list: listData } = req.body;
	const list = JSON.parse(listData);
	const wb = XLSX.read(req.files.file.data, { type: "buffer" });
	const sheet = wb.Sheets[wb.SheetNames[0]];
	const json = XLSX.utils.sheet_to_json(sheet, { header: 0 });

	let contactListId = null;
	if (!list?.id) {
		const contactList = await ContactList.create({ name: list.name, userId: req.auth.id });
		contactListId = contactList.id;
	} else {
		const contactList = await ContactList.findByPk(list?.id);
		if (!contactList) {
			res.status(400);
		}
		contactListId = contactList.id;

		await Contact.destroy({
			where: {
				contactListId,
			},
		});
	}
	let data = [];
	for (let jsonItem of json) {
		if (!!jsonItem?.first_name) {
			data.push(buildContactModel(jsonItem, contactListId, req.auth.id));
		}
	}

	const contactCreated = await Contact.bulkCreate(data);

	return res.status(200).json(contactCreated);
});

router.get("/contact-list", isAuthenticated, async function (req, res, next) {
	const list = await ContactList.findAll({
		order: [["name", "ASC"]],
		where: { [Op.or]: [{ userId: req.auth.id }, { userId: null }] },
	});

	res.status(200).json(list);
});

export default router;
