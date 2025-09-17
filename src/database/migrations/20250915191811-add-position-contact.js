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

exports.up = (db) => db.addColumn("Contacts", "position", { type: "string", allowNull: true });

exports.down = function (db) {
	return db.removeColumn("Contacts", "position");
};

exports._meta = {
	version: 1,
};
