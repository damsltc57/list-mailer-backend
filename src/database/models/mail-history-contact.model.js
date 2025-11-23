import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const MailHistoriesContacts = sequelize.define(
	"MailHistoriesContacts",
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		status: DataTypes.STRING,
		mailHistoryId: DataTypes.INTEGER,
		contactId: DataTypes.INTEGER,
		email: DataTypes.STRING,
		collaboratorId: DataTypes.INTEGER,
	},
	{ timestamps: false },
);

export default MailHistoriesContacts;
