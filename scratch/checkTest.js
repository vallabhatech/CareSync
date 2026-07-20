const { sanitizeConfig } = require('../../src/utils/sanitize.js'); // Assuming Babel or we use ES module import?

const obj = JSON.parse(`{
  "safeKey": "safeValue",
  "__proto__": { "polluted": true },
  "constructor": { "polluted": true },
  "prototype": { "polluted": true }
}`);

const res = sanitizeConfig(obj);
console.log('hasOwnProperty __proto__:', Object.prototype.hasOwnProperty.call(res, '__proto__'));
console.log('hasOwnProperty constructor:', Object.prototype.hasOwnProperty.call(res, 'constructor'));
console.log('hasOwnProperty prototype:', Object.prototype.hasOwnProperty.call(res, 'prototype'));
console.log(res);
