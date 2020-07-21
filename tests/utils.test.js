'use strict';

const utils = require('../lib/utils');

test('adds 1 + 2 to equal 3', () => {
  expect(utils.sum(1, 2)).toBe(3);
});

test('subs 3 - 2 to equal 1', () => {
  expect(utils.sub(3, 2)).toBe(1);
});
