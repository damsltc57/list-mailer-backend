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
	db.createTable("MailHistories", {
		id: {
			type: "int",
			primaryKey: true,
			notNull: true,
			autoIncrement: true,
		},
		mailAccountId: { type: "int", allowNull: false },
		object: { type: "string", allowNull: true },
		content: { type: "string", allowNull: true },
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
	return db.dropTable("MailHistories");
};

exports._meta = {
	version: 1,
};
