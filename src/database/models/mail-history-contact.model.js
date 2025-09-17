import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";
import Contact from "./contact.model.js";

const MailHistoriesContacts = sequelize.define(
	"MailHistoriesContacts",
	{
		status: DataTypes.STRING,
		mailHistoryId: DataTypes.INTEGER,
		contactId: DataTypes.INTEGER,
		email: DataTypes.STRING,
	},
	{ timestamps: false },
);

export default MailHistoriesContacts;
