import config from "../config.js";
import { Sequelize } from "sequelize";

const env = process.env.NODE_ENV || "development";
const currentConfig = config[env];

import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

let sequelize;
try {
	sequelize = new Sequelize({
		...currentConfig,
		models: [__dirname + "/**/*.model.ts"],
		modelMatch: (filename, member) => {
			return filename.substring(0, filename.indexOf(".model")) === member.toLowerCase();
		},
	});
} catch (error) {
	throw error;
}

export default sequelize;
