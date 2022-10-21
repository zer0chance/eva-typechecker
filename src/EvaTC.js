const Type = require('./Type');

/**
 * Static Eva typechecker.
 */
class EvaTC {

    /**
     * Validates type of expression.
     */
    tc(exp) {

        if (this._isNumber(exp)) {
            return Type.number;
        }
        
        if (this._isString(exp)) {
            return Type.string;
        }
    }

    _isNumber(exp) {
        return typeof exp === 'number';
    }

    _isString(exp) {
        return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
    }
}

module.exports = EvaTC;
