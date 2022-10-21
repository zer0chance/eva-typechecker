const Type = require('../src/Type');
const {test} = require('./test_utils');

module.exports = eva => {
    test(eva, 42, Type.number);

    test(eva, '"Hello world!"', Type.string);

    test(eva, true, Type.boolean);
    test(eva, false, Type.boolean);
}
