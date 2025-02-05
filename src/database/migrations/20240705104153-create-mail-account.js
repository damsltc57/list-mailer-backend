"use strict";

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
	dbm = options.dbmigrate;
	type = dbm.dataType;
	seed = seedLink;
};

exports.up = (db) =>
	db.createTable("MailAccounts", {
		id: {
			type: "int",
			primaryKey: true,
			notNull: true,
			autoIncrement: true,
		},
		host: { type: "string", allowNull: true },
		port: { type: "int" },
		secure: { type: "boolean", allowNull: true },
		email: { type: "string", unique: false },
		user: { type: "string", allowNull: false },
		pass: { type: "string", allowNull: false },
		emailNickname: { type: "string", allowNull: true },
		userId: { type: "int", allowNull: false },
		accessToken: { type: "string", allowNull: true },
		refreshToken: { type: "string", allowNull: true },
		googleId: { type: "string", allowNull: true },
		expires: { type: "int", allowNull: true },
		signature: { type: "string", allowNull: true },
		createdAt: {
			notNull: true,
			type: new String("TIMESTAMPTZ"),
			defaultValue: new String("now()"),
		},
		updatedAt: {
			notNull: true,
			type: new String("TIMESTAMPTZ"),
			defaultValue: new String("now()"),
		},
	});

exports.down = function (db) {
	return db.dropTable("MailAccounts");
};

exports._meta = {
	version: 1,
};
