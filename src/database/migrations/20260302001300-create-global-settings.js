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
    db.createTable("GlobalSettings", {
        id: {
            type: "int",
            primaryKey: true,
            notNull: true,
            autoIncrement: true,
        },
        batchLimit: {
            type: "int",
            notNull: true,
            defaultValue: 5,
        },
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
    }).then(() => {
        return db.insert('GlobalSettings', ['batchLimit'], [5]);
    });

exports.down = function (db) {
    return db.dropTable("GlobalSettings");
};

exports._meta = {
    version: 1,
};
