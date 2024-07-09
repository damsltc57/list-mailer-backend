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
	db.createTable("Contacts", {
		id: {
			type: "uuid",
			primaryKey: true,
			notNull: true,
			defaultValue: new String("uuid_generate_v4()"),
		},
		firstName: { type: "string" },
		lastName: { type: "string" },
		email: { type: "string", unique: false },
		tvProducer: { type: "boolean", allowNull: false },
		filmProducer: { type: "boolean", allowNull: false },
		broadcaster: { type: "boolean", allowNull: false },
		distributor: { type: "boolean", allowNull: false },
		companyName: { type: "string", allowNull: true },
		/**
		 * formalityLevel = "informal"  # pour tutoyer
		 * formalityLevel = "formal"  # pour vouvoyer
		 */
		formalityLevel: { type: "string", allowNull: true },
		interesting: { type: "boolean", allowNull: true },
		country: { type: "string", allowNull: true },
		website: { type: "string", allowNull: true },
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
	return db.dropTable("Contacts");
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
