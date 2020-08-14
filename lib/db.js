'use strict';

const sqlite3 = require('sqlite3').verbose();
const { OverloadError } = require('./errors');
const { promisify } = require('./utils');

class Database {
  constructor() {
    if (new.target === Database) {
      throw new TypeError('Cannot construct Database instances directly');
    }

    this.PARAMETER = undefined;
  }

  all() {
    throw new OverloadError();
  }
  insertReturningId() {
    throw new OverloadError();
  }

  _validateAllParams(statement, params) {
    if (typeof statement !== 'string') {
      throw new TypeError('Statement should be string');
    }

    if (params && !(params instanceof Array)) {
      throw new TypeError('Params should be array');
    }
  }
  _validateInsertParams(table, values) {  // TODO: check implementation
    if (typeof table !== 'string') {
      throw new TypeError('Table should be string');
    }

    if (!(values instanceof Object)) {
      throw new TypeError('Params should be object');
    }
  }

  encodeTime() {
    throw new OverloadError();
  }
  decodeTime() {
    throw new OverloadError();
  }
}

class SQLiteDatabase extends Database {
  constructor(address) {
    super();
    this._db = new sqlite3.Database(address, sqlite3.OPEN_READWRITE);
    this.PARAMETER = '?';
  }

  all(statement, params) {
    this._validateAllParams(statement, params);
    return promisify(this._db.all.bind(this._db))(statement, params);
  }
  insertReturningId(table, values) {
    this._validateInsertParams(table, values);
    const names = [];
    const params = [];
    for (const name in values) {
      if (Object.hasOwnProperty.call(values, name)) {
        names.push(name);
        params.push(values[name]);
      }
    }

    const sql = `insert into ${table}(` +
      names.join(',') +
      ') values(' +
      params.map(() => this.PARAMETER).join(',') +
      ');';

    const getid = cb => this._db.run.bind(this._db)(sql, params, function(err) {
      if (err) {
        cb(err, null);
        return;
      }

      cb(null, this.lastID);
    });
    return promisify(getid)();
  }

  encodeTime(time) {
    if (!(time instanceof Date)) {
      throw new TypeError('Time should be date');
    }
    return time.getTime().toString();
  }
  decodeTime(encodedTime) {
    if (typeof encodedTime !== 'string') {
      throw new TypeError('EncodedTime should be string');
    }
    return new Date(parseInt(encodedTime));
  }
}

module.exports = { Database, SQLiteDatabase };
