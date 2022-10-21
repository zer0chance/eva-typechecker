const Type = require('../src/Type');

const {exec, test} = require('./test_utils');

module.exports = eva => {

  test(eva, `(<= 1 10)`, Type.boolean);

  // Both branches should return the same type.

  test(eva,
  `
    (var x 10)
    (var y 20)
    (if (<= x 10)
      (set y 1)
      (set y 2))
    y
  `,
  Type.number);

};