'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.createTable('CronLogs', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    cronName: { type: 'string', notNull: true },
    summary: { type: 'string' },
    status: { type: 'string', notNull: true },
    details: { type: 'text' },
    timestamp: { type: 'datetime', notNull: true },
    createdAt: { type: 'datetime' },
    updatedAt: { type: 'datetime' }
  });
};

exports.down = function (db) {
  return db.dropTable('CronLogs');
};

exports._meta = {
  "version": 1
};
