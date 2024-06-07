import dotenv from "dotenv";
import pg from "pg";
delete pg.native;

dotenv.config();

const config = {
	development: {
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT ? process.env.DB_PORT : "5432"),
		dialect: "postgres",
		dialectModule: pg,
	},
	production: {
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT ? process.env.DB_PORT : "5432"),
		dialect: "postgres",
		logging: false,
		// Essential line because of https://github.com/zeit/ncc/issues/345 and https://github.com/zeit/now-builders/issues/331
		dialectModule: pg,
	},
};

export default config;
