import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";
import Contact from "./contact.model.js";
import MailHistoriesContacts from "./mail-history-contact.model.js";

const MailHistories = sequelize.define("MailHistories", {
	mailAccountId: DataTypes.INTEGER,
	object: DataTypes.STRING,
	content: DataTypes.STRING,
});

// MailHistories.belongsToMany(Contact, {
// 	as: "to",
// 	through: MailHistoriesContacts,
// });

MailHistories.belongsToMany(Contact, {
	as: "to",
	through: MailHistoriesContacts,
	foreignKey: "mailHistoryId", // replaces `productId`
	otherKey: "contactId", // replaces `categoryId`
});
export default MailHistories;
