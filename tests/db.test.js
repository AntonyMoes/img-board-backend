'use strict';

const { Database, SQLiteDatabase } = require('../lib/db');
const { OverloadError } = require('../lib/errors');
const sqlite3 = require('sqlite3');

const testTable = 'test';
const dateString = '2020-07-25T21:13:47.059Z';
const date = new Date(dateString);
const testSQLiteDBPath = 'data/testdb.sqlite';
const getTestSQLiteDB = () => new sqlite3.Database(
  testSQLiteDBPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

function createTestSQLiteDB(done) {
  const testDB = getTestSQLiteDB();
  testDB.serialize(() => {
    testDB
      .run(
        `drop table if exists ${testTable};`
      )
      .run(
        `create table ${testTable} ( 
          id integer not null primary key autoincrement, 
          text text, 
          time text 
        );`,
        (err) => done(err)
      )
  });
}
function deleteTestSQLiteDB(done) {
  const testDB = getTestSQLiteDB();
  testDB.run(`drop table if exists ${testTable};`, (err) => done(err));
}

class AbstractTestingDatabase extends Database {
  constructor() {
    super();
  }
}

describe('Abstract db testing', () => {
  test('should not construct Database class', () => {
    const fn = () => {
      return new Database();
    }

    expect(fn).toThrow(TypeError);
  });

  test('should construct AbstractTestingDatabase class', () => {
    const fn = () => {
      return new AbstractTestingDatabase();
    }

    expect(fn).not.toThrow();
  });

  test('not-overloaded methods should throw', () => {
    const db = new AbstractTestingDatabase();

    expect(db.all.bind(db)).toThrow(OverloadError);
    expect(db.insertReturningId.bind(db)).toThrow(OverloadError);
    expect(db.encodeTime.bind(db)).toThrow(OverloadError);
    expect(db.decodeTime.bind(db)).toThrow(OverloadError);
  });

  test('validateAllParams should reject invalid parameters', () => {
    const db = new AbstractTestingDatabase();

    expect(() => db._validateAllParams()).toThrow(TypeError);
    expect(() => db._validateAllParams(123)).toThrow(TypeError);
    expect(
      () => db._validateAllParams(`select * from ${testTable};`, 123)
    ).toThrow(TypeError);
    expect(
      () => db._validateAllParams(undefined, [1, 2, 3])
    ).toThrow(TypeError);
  });

  test('validateAllParams should accept valid parameters', () => {
    const db = new AbstractTestingDatabase();
    expect(
      () => db._validateAllParams(`select * from ${testTable};`)
    ).not.toThrow(TypeError);
    expect(
      () => db._validateAllParams(
        `select ${db.PARAMETER} as table_name from ${testTable};`,
        [testTable]
      )
    ).not.toThrow(TypeError);
  });

  test('validateInsertParams should reject invalid parameters', () => {
    const db = new AbstractTestingDatabase();

    expect(() => db._validateInsertParams()).toThrow(TypeError);
    expect(() => db._validateInsertParams(123)).toThrow(TypeError);
    expect(() => db._validateInsertParams(`${testTable}`)).toThrow(TypeError);
    expect(
      () => db._validateInsertParams(`${testTable}`, 'qwe')
    ).toThrow(TypeError);
    expect(
      () => db._validateInsertParams(null, {name: testTable})
    ).toThrow(TypeError);
  });

  test('validateInsertParams should accept valid parameters', () => {
    const db = new AbstractTestingDatabase();
    expect(
      () => db._validateInsertParams(`${testTable};`, {name: testTable})
    ).not.toThrow(TypeError);
  });
});

function testDBClass(databaseClass, instanceParams,
  beforeAllFn, afterAllFn, beforeEachFn, afterEachFn) {
  describe(`${databaseClass.name} testing`, () => {
    if (beforeAllFn) beforeAll(done => {
      beforeAllFn(done);
    });
    if (afterAllFn) afterAll(done => {
      afterAllFn(done);
    });
    if (beforeEachFn) beforeEach(done => {
      beforeEachFn(done);
    });
    if (afterEachFn) afterEach(done => {
      afterEachFn(done);
    });

    test('should construct successfully', () => {
      const fn = () => {
        return new databaseClass(...instanceParams);
      }

      expect(fn).not.toThrow();
    });

    test('should overload Database functions', () => {
      const db = new databaseClass(...instanceParams);

      expect(db.all.bind(db)).not.toThrow(OverloadError);
      expect(db.insertReturningId.bind(db)).not.toThrow(OverloadError);
      expect(db.encodeTime.bind(db)).not.toThrow(OverloadError);
      expect(db.decodeTime.bind(db)).not.toThrow(OverloadError);
    });

    describe('date encoding testing', () => {
      const db = new databaseClass(...instanceParams);

      test('encoding should not accept wrong types', () => {
        expect(() => db.encodeTime(date)).not.toThrow(TypeError);
        expect(() => db.encodeTime(dateString)).toThrow(TypeError);
        expect(() => db.encodeTime(1)).toThrow(TypeError);
      });

      test('encoding should return string', () => {
        expect(typeof db.encodeTime(date)).toBe('string');
      });

      test('decoding should not accept wrong types', () => {
        const encoded = db.encodeTime(date);
        expect(() => db.decodeTime(encoded)).not.toThrow(TypeError);
        expect(() => db.decodeTime(date)).toThrow(TypeError);
        expect(() => db.decodeTime(1)).toThrow(TypeError);
      });

      test('decoding should return Date', () => {
        expect(db.decodeTime(db.encodeTime(date))).toBeInstanceOf(Date);
      });

      test('encoding and decoding should not modify date', () => {
        expect(db.decodeTime(db.encodeTime(date)).getTime()).toBe(date.getTime());
      });
    });

    describe('"all" method testing', () => {
      const db = new databaseClass(...instanceParams);

      test('"all" method should invoke validator', async () => {
        const spy = jest.spyOn(db, '_validateAllParams');

        try {
          await db.all();
        } catch (_) {}
        expect(spy).toHaveBeenCalled();

        spy.mockRestore();
      });

      // TODO: maybe write more tests
      test('"all" method should insert and extract data correctly', async () => {
        const text = 'qwe';
        await db.all(
          `insert into ${testTable}(text, time) values(?,?)`,
          [text, db.encodeTime(date)]
        )

        const data = await db.all(`select * from ${testTable}`);
        expect(data).toEqual([{
          id: 1,
          text: text,
          time: db.encodeTime(date)
        }]);
      });
    });

    describe('"insertReturningId" method testing', () => {
      const db = new databaseClass(...instanceParams);

      test('"insertReturningId" method should invoke validator', async () => {
        const spy = jest.spyOn(db, '_validateInsertParams');

        try {
          await db.insertReturningId();
        } catch (_) {}
        expect(spy).toHaveBeenCalled();

        spy.mockRestore();
      });

      test('"insertReturningId" method should reject on invalid params', () => {
        const text = 'qwe';
        const promise = db.insertReturningId(
          testTable,
          { texttext: text, timetime: db.encodeTime(date) }
        );

        expect(promise).rejects.toBeDefined();
      });

      // TODO: maybe write more tests
      test('"insertReturningId" method should insert data correctly and return proper id', async () => {
        const text = 'qwe';

        const id = await db.insertReturningId(
          testTable,
          { text: text, time: db.encodeTime(date) }
        );
        expect(id).toBe(1);

        const data = await db.all(`select * from ${testTable}`);
        expect(data).toEqual([{
          id: 1,
          text: text,
          time: db.encodeTime(date)
        }]);
      });
    });

  });
}

testDBClass(SQLiteDatabase,
  [testSQLiteDBPath],
  null,
  null,
  createTestSQLiteDB,
  deleteTestSQLiteDB
);
