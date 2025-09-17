import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const Collaborator = sequelize.define(
	"collaborator",
	{
		firstName: DataTypes.STRING,
		lastName: DataTypes.STRING,
		email: DataTypes.STRING,
		phone: DataTypes.STRING,
		position: DataTypes.STRING,
		linkedin: DataTypes.STRING,
		contactId: DataTypes.INTEGER,
	},
	{ tableName: "Collaborators" },
);

export default Collaborator;
