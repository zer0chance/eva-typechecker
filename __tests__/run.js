const assert = require('assert');

const EvaTC = require('../src/EvaTC');

const eva = new EvaTC();

tests = [
    require('./self_eval_test'),
    require('./math_test'),
    require('./varaible_test'),
    require('./block_test'),
    require('./if_test'),
    require('./while_test'),
    require('./user_defined_functions_test'),
]

tests.forEach(test => test(eva));

console.log('All assertions passed!');
