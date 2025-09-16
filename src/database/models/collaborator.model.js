import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const Collaborator = sequelize.define("Collaborator", {
	firstName: DataTypes.STRING,
	lastName: DataTypes.STRING,
	email: DataTypes.STRING,
	phone: DataTypes.STRING,
	position: DataTypes.STRING,
	linkedin: DataTypes.STRING,
	contactId: DataTypes.INTEGER,
});

export default Collaborator;
