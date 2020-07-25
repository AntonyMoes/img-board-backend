'use strict';

/*function isIterable(obj) {
  if (obj === null || obj === undefined) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}*/

function promisify(callbackLastFunction) {
  return (...args) => new Promise((resolve, reject) => {
    callbackLastFunction(...args, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}


module.exports = { promisify };
