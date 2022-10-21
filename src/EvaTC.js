const { env } = require('process');
const Type = require('./Type');
const TypeEnvironment = require('./TypeEnvironment');

/**
 * Static Eva typechecker.
 */
class EvaTC {

    constructor() {
        // Creating global environment.
        this.global = new TypeEnvironment({
            VERSION: Type.string,
        });
    }
    
    /**
     * Evaluate global code wrapping into scope.
     */
    tcGlobal(exp) {
        return this._tcBlock(exp, this.global);
    }

    /**
     * Validates type of expression.
     */
    tc(exp, env = this.global) {

        // Self-evaluating expression
        if (this._isNumber(exp)) {
            return Type.number;
        }
        
        if (this._isString(exp)) {
            return Type.string;
        }

        if (this._isBoolean(exp)) {
            return Type.boolean;
        }

        // Math operations
        if (this._isBinary(exp)) {
            return this._binary(exp, env);
        }

        // Boolean binary
        if (this._isBooleanBinary(exp)) {
            return this._booleanBinary(exp, env);
        }

        // Variable declarations
        if (exp[0] === 'var') {
            const [_tag, name, value] = exp;

            const valueType = this.tc(value, env);

            // In case if user provides a type of a variable:
            // (var (x number) 5)
            if (Array.isArray(name)) {
                const [varName, typeStr] = name;

                const expectedType = Type.fromString(typeStr);

                this._expect(valueType, expectedType, value, exp);

                return env.define(varName, valueType);
            }

            return env.define(name, valueType);
        }

        // Variable update
        if (exp[0] === 'set') {
            const [_tag, ref, value] = exp;

            // Type of new value should be the same as initial type
            const valueType = this.tc(value, env);
            const varType = this.tc(ref, env);

            return this._expect(valueType, varType, value, exp);
        }

        // Variable access
        if (this._isVariableName(exp)) {
            return env.lookup(exp);
        }

        // Blocks
        if (exp[0] === 'begin') {
            const blockEnv = new TypeEnvironment({}, env);
            return this._tcBlock(exp, blockEnv);
        }

        // If expressions
        if (exp[0] === 'if') {
            const [_tag, condition, consequent, alternate] = exp;

            // Type of new value should be the same as initial type
            const t1 = this.tc(condition, env);
            this._expect(t1, Type.boolean, condition, exp);

            const t2 = this.tc(consequent, env);
            const t3 = this.tc(alternate, env);

            return this._expect(t3, t2, exp, exp);
        }

        // while expressions
        if (exp[0] === 'while') {
            const [_tag, condition, body] = exp;

            // Type of new value should be the same as initial type
            const t1 = this.tc(condition, env);
            this._expect(t1, Type.boolean, condition, exp);

            return this.tc(body, env);
        }
    }

    _tcBlock(exp, env) {
        let result;

        const [_tag, ...expressions] = exp;

        expressions.forEach(exp => {
            result = this.tc(exp, env);
        })

        return result;
    }

    _isVariableName(exp) {
        return typeof exp === 'string' && /^[+\-*<>=a-zA-Z0-9_:]+$/.test(exp);
    }

    _isNumber(exp) {
        return typeof exp === 'number';
    }

    _isString(exp) {
        return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
    }

    _isBoolean(exp) {
        return typeof exp === 'boolean' || exp === 'true' || exp === 'false';
    }

    _isBinary(exp) {
        return /^[+\-*/]$/.test(exp[0]);
    }

    _isBooleanBinary(exp) {
        return exp[0] === '>'  ||
               exp[0] === '<'  ||
               exp[0] === '>=' ||
               exp[0] === '<=' ||
               exp[0] === '!=' ||
               exp[0] === '==';
    } 

    _binary(exp, env) {
        this._checkArity(exp, 2);

        const t1 = this.tc(exp[1], env);
        const t2 = this.tc(exp[2], env);

        const allowedTypes = this._getOperandsTypeForOperator(exp[0]);
        this._expectOperatorType(t1, allowedTypes, exp);
        this._expectOperatorType(t2, allowedTypes, exp);

        return this._expect(t2, t1, exp[2], exp);
    }

    _booleanBinary(exp, env) {
        this._checkArity(exp, 2);

        const t1 = this.tc(exp[1], env);
        const t2 = this.tc(exp[2], env);

        this._expect(t2, t1, exp[2], exp);

        return Type.boolean;
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
