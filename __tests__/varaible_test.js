const Type = require('../src/Type');
const {test} = require('./test_utils');

module.exports = eva => {
    test(eva, ['var', 'x', 5], Type.number);
    test(eva, ['var', ['y', 'number'], 5], Type.number);

    test(eva, 'x', Type.number);
    test(eva, 'y', Type.number);

    test(eva, 'VERSION', Type.string);
};
