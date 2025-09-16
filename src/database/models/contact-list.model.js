import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const ContactList = sequelize.define("ContactList", {
	name: DataTypes.STRING,
	userId: DataTypes.INTEGER,
});

export default ContactList;
