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
	db.createTable("ContactLists", {
		id: {
			type: "int",
			primaryKey: true,
			notNull: true,
			autoIncrement: true,
		},
		name: { type: "string" },
		userId: { type: "int" },
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
	return db.dropTable("ContactLists");
};

exports._meta = {
	version: 1,
};

/**
 * PAYS
 * Cinéma ou Télévision
 * Rôle
 * Genre
 * Interessant
 * Tutoiement
 * Nom de la société
 * Rue
 * Code postal
 * Pays
 * téléphone
 * Prénom
 * Nom
 * Mail
 * Poste
 * Site Web
 * Linkedin
 */
