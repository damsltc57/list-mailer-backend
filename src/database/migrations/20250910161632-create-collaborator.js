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
	db.createTable("Collaborators", {
		id: {
			type: "int",
			primaryKey: true,
			notNull: true,
			autoIncrement: true,
		},
		firstName: { type: "string" },
		lastName: { type: "string" },
		email: { type: "string" },
		phone: { type: "string" },
		position: { type: "string" },
		linkedin: { type: "string" },
		contactId: { type: "int", allowNull: false },
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
	return db.dropTable("Collaborators");
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
