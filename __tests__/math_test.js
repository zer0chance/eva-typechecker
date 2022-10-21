const Type = require('../src/Type');
const {test} = require('./test_utils');

module.exports = eva => {
    test(eva, ['+', 4, 5], Type.number);
    test(eva, ['-', 3, 5], Type.number);
    test(eva, ['*', 4, 1], Type.number);
    test(eva, ['/', 4, 3], Type.number);

    test(eva, ['+', '"Hello"', '"world"'], Type.string);
}
