import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const Contact = sequelize.define("Contact", {
	firstName: DataTypes.STRING,
	lastName: DataTypes.STRING,
	email: DataTypes.STRING,
	tvProducer: DataTypes.BOOLEAN,
	filmProducer: DataTypes.BOOLEAN,
	broadcaster: DataTypes.BOOLEAN,
	distributor: DataTypes.BOOLEAN,
	companyName: DataTypes.STRING,
	formalityLevel: DataTypes.STRING,
	interesting: DataTypes.BOOLEAN,
	country: DataTypes.STRING,
	website: DataTypes.STRING,
	contactListId: DataTypes.INTEGER,
	userId: DataTypes.INTEGER,
});

export default Contact;
