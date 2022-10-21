const assert = require("assert");

function exec(eva, exp) {
    return eva.tc(exp);
}

function test(eva, exp, expected) {
    const actual = eva.tc(exp);
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
