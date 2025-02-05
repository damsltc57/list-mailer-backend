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
	db.createTable("Users", {
		id: {
			type: "int",
			primaryKey: true,
			notNull: true,
			autoIncrement: true,
		},
		firstName: { type: "string" },
		lastName: { type: "string" },
		email: { type: "string", unique: true },
		password: { type: "string", allowNull: false },
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
	return db.dropTable("Users");
};

exports._meta = {
	version: 1,
};
