'use strict';

class OverloadError extends Error {
  constructor() {
    super('Cannot call not-overloaded version of this method');
  }
}

module.exports = { OverloadError };
