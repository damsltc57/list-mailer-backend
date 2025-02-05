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
	db.createTable("MailHistoriesContacts", {
		id: {
			type: "int",
			primaryKey: true,
			notNull: true,
			autoIncrement: true,
		},
		contactId: { type: "int", allowNull: false },
		mailHistoryId: { type: "int", allowNull: false },
		/*
		-sending
		-error
		-sent
		 */
		status: { type: "string", allowNull: false },
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
	return db.dropTable("MailHistoriesContacts");
};

exports._meta = {
	version: 1,
};
