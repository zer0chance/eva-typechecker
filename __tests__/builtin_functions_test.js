const Type = require('../src/Type');
const {test} = require('./test_utils');

module.exports = eva => {
  test(eva, `(sum 1 5)`, Type.number);
  test(eva, `(sum (square 2) 4)`, Type.number);
};