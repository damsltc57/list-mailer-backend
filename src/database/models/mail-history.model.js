import sequelize from "./index.js";
import { DataTypes } from "sequelize";
import Contact from "./contact.model.js";

const MailHistoriesContacts = sequelize.define(
	"MailHistoriesContacts",
	{ contactId: DataTypes.UUID, mailHistoryId: DataTypes.UUID },
	{ timestamps: false },
);

const MailHistories = sequelize.define("MailHistories", {
	mailAccountId: DataTypes.UUID,
	object: DataTypes.STRING,
	content: DataTypes.STRING,
});

// MailHistories.belongsToMany(Contact, {
// 	as: "to",
// 	through: MailHistoriesContacts,
// });

MailHistories.belongsToMany(Contact, {
	as: "to",
	through: "MailHistoriesContacts",
	foreignKey: "mailHistoryId", // replaces `productId`
	otherKey: "contactId", // replaces `categoryId`
});
export default MailHistories;
