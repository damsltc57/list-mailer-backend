import sequelize from "./index.js";
import { DataTypes } from "sequelize";
import Contact from "./contact.model.js";

const MailHistoriesContacts = sequelize.define(
	"MailHistoriesContacts",
	{ status: DataTypes.STRING, mailHistoryId: DataTypes.UUID, contactId: DataTypes.UUID },
	{ timestamps: false },
);

export default MailHistoriesContacts;
