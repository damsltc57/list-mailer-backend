// db.js
import { Sequelize } from "sequelize";
import config from "./config.js";

const env = process.env.NODE_ENV || "development";
const currentConfig = config[env];

export const sequelize = new Sequelize({
	...currentConfig,
	// Pas d'option `models` ici avec sequelize “vanilla”
});

export async function connectDB() {
	await sequelize.authenticate();
}
