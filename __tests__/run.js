const assert = require('assert');

const EvaTC = require('../src/EvaTC');

const eva = new EvaTC();

assert.equal(eva.tc(1), 'number');
assert.equal(eva.tc('"hello'), 'string');

console.log('All assertions passed!');
