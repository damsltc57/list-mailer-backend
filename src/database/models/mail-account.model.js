import sequelize from "./index.js";
import { DataTypes } from "sequelize";

const MailAccounts = sequelize.define("MailAccount", {
	host: DataTypes.STRING,
	port: DataTypes.INTEGER,
	secure: DataTypes.BOOLEAN,
	email: DataTypes.STRING,
	user: DataTypes.STRING,
	pass: DataTypes.STRING,
	emailNickname: DataTypes.STRING,
	userId: DataTypes.INTEGER,
	accessToken: DataTypes.STRING,
	refreshToken: DataTypes.STRING,
	googleId: DataTypes.STRING,
	expires: DataTypes.INTEGER,
	signature: DataTypes.STRING,
	dkim: DataTypes.JSON,
});

export default MailAccounts;
