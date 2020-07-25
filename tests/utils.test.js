'use strict';

const { promisify } = require('../lib/utils');

describe('promisify testing', () => {
  test('should return function', () => {
    const fn = () => {};
    expect(promisify(fn)).toBeInstanceOf(Function);
  });

  test('returned function should return promise', () => {
    const fn = () => {};
    expect(promisify(fn)()).toBeInstanceOf(Promise);
  });

  test('promises should correctly resolve', () => {
    const fn = (cb) => {
      cb(null, { data: 'data' });
    };
    const promise = promisify(fn)();

    return expect(promise).resolves.toStrictEqual({ data: 'data' });
  });

  test('promises should correctly reject', () => {
    const fn = (cb) => {
      cb(new Error(''), null);
    };
    const promise = promisify(fn)();

    return expect(promise).rejects.toStrictEqual(new Error(''));
  });
});
