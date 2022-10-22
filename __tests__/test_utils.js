const assert = require('assert');
const evaParser = require('../parser/evaParser')

function exec(eva, exp) {
    if (typeof exp === 'string') {
        exp = evaParser.parse(`(begin ${exp})`);
    }
    return eva.tcGlobal(exp);
}

function test(eva, exp, expected) {
    const actual = exec(eva, exp);
    try {
        assert.strictEqual(actual.equals(expected), true);
    } catch(e) {
        console.log(`Expected type of ${exp} to be ${expected}, but got: ${actual}`);
        throw e;
    }
}

module.exports = {
    exec,
    test
};
