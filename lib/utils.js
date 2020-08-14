'use strict';

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
