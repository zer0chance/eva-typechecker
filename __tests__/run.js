const assert = require('assert');

const EvaTC = require('../src/EvaTC');

const eva = new EvaTC();

tests = [
    require('./self_eval_test'),
]

tests.forEach(test => test(eva));

console.log('All assertions passed!');
