const Type = require('./Type');

/**
 * Static Eva typechecker.
 */
class EvaTC {

    /**
     * Validates type of expression.
     */
    tc(exp) {

        // Self-evaluating expression
        if (this._isNumber(exp)) {
            return Type.number;
        }
        
        if (this._isString(exp)) {
            return Type.string;
        }

        // Math operations
        if (this._isBinary(exp)) {
            return this._binary(exp);
        }
    }

    _isNumber(exp) {
        return typeof exp === 'number';
    }

    _isString(exp) {
        return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
    }

    _isBinary(exp) {
        return /^[+\-*/]$/.test(exp[0]);
    }

    _binary(exp) {
        this._checkArity(exp, 2);

        const t1 = this.tc(exp[1]);
        const t2 = this.tc(exp[2]);

        const allowedTypes = this._getOperandsTypeForOperator(exp[0]);
        this._expectOperatorType(t1, allowedTypes, exp);
        this._expectOperatorType(t2, allowedTypes, exp);

        return this._expect(t2, t1, exp[2], exp);
    }

    /**
     * Returns allowed operators type for the operator.
     */
    _getOperandsTypeForOperator(operator) {
        switch(operator) {
            case '+':
                return [Type.string, Type.number];
            case '-':
            case '/':
            case '*':
                return [Type.number];
            default:
                throw `Unknown operator: ${operator}`;
        }
    }

    /**
     * Expects the type.
     */
    _expect(actualType, expectedType, value, exp) {
        if (!actualType.equals(expectedType)) {
            this._throw(actualType, expectedType, value, exp);
        }
        return actualType;
    }

    /**
     * Expects the type of operator.
     */
    _expectOperatorType(actual, allowedTypes, exp) {
        if (!allowedTypes.some(t => t.equals(actual))) {
            throw `Unexpected type: ${actual} in ${exp}. Allowed: ${allowedTypes}`;
        }
    }

    /**
     * Throws unexpected type.
     */
    _throw(actualType, expectedType, value, exp) {
        throw `Unexpected type ${actualType} of ${value} in ${exp}. Expected: ${expectedType}.`;
    }

    /**
     * Checks the amount of arguments.
     */
    _checkArity(exp, arity) {
        if (exp.length - 1 !== arity) {
            throw `Operator ${exp[0]} expected ${arity} arguments but ${exp.length - 1} given!`;
        }
    }
}

module.exports = EvaTC;
