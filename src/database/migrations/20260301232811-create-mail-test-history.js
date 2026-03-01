"use strict";

let dbm;
let type;
let seed;

exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
};

exports.up = (db) =>
    db.createTable("MailTestHistories", {
        id: {
            type: "int",
            primaryKey: true,
            notNull: true,
            autoIncrement: true,
        },
        mailAccountId: { type: "int", notNull: true },
        object: { type: "string" },
        content: { type: "text" },
        to: { type: "string" },
        status: { type: "string" },
        response: { type: "text" },
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
    return db.dropTable("MailTestHistories");
};

exports._meta = {
    version: 1,
};
