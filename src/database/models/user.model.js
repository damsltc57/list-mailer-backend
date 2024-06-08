import bcrypt from "bcrypt";
import sequelize from "./index.js";
import { DataTypes } from "sequelize";

const User = sequelize.define("User", {
	firstName: DataTypes.STRING,
	lastName: DataTypes.STRING,
	email: DataTypes.STRING,
	signature: DataTypes.STRING,
	password: {
		type: DataTypes.STRING,
		set(value) {
			this.setDataValue("password", bcrypt.hashSync(value, 15));
		},
	},
});

export default User;
