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
            sum: Type.fromString('Fn<number<number,number>>'),
            square: Type.fromString('Fn<number<number>>')
        });
    }
    
    /**
     * Evaluate global code wrapping into scope.
     */
    tcGlobal(exp) {
        return this._tcBody(exp, this.global);
    }

    /**
     * Checks body (global or function).
     */
    _tcBody(body, env) {
        if (body[0] === 'begin') {
        return this._tcBlock(body, env);
        }
        return this.tc(body, env);
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

        // Types aliasing
        if (exp[0] === 'type') {
            const [_tag, name, base] = exp;

            // Union type: (or number string)
            if (base[0] === 'or') {
                const options = base.slice(1);
                const optionTypes = options.map(option => Type.fromString(option));
                return (Type[name] = new Type.Union({name, optionTypes}));
            } else {
                if (Type.hasOwnProperty(name)) {
                    throw `Type "${name}" is already defined: ${exp}`;
                }

                if (!Type.hasOwnProperty(base)) {
                    throw `Type "${base}" is undefined: ${exp}`;
                }

                return (Type[name] = new Type.Alias({
                    name,
                    parent: Type[base]
                }));
            }
        }

        // Class declaration
        if (exp[0] === 'class') {
            const [_tag, name, superClassName, body] = exp;

            const superClass = Type[superClassName];
            const classType  = new Type.Class({name, superClass});

            Type[name] = env.define(name, classType);

            this._tcBody(body, classType.env);

            return classType;
        }

        // New calls
        if (exp[0] === 'new') {
            const [_tag, className, ...argValues] = exp;

            const classType = Type[className];

            if (!classType) {
                throw `Unknown class ${classType}`;
            }

            const argTypes = argValues.map(arg => this.tc(arg, env));

            return this._checkFunctionCall(
                classType.getField('constructor'),
                [classType, ...argTypes],
                env,
                exp
            );
        }

        // Super calls
        if (exp[0] === 'super') {
            const [_tag, className] = exp;

            const classType = Type[className];

            if (classType === null) {
                throw `Unknown class ${classType}`;
            }

            return classType.superClass;
        }

        // Property access
        if (exp[0] === 'prop') {
            const [_tag, instance, name] = exp;

            const instanceType = this.tc(instance, env);

            return instanceType.getField(name);
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

            // Prop assignment
            if (ref[0] === 'prop') {
                const [_tag, instance, propName] = ref;
                const instanceType = this.tc(instance, env);

                const valueType = this.tc(value, env);
                const propType = instanceType.getField(propName);

                return this._expect(valueType, propType, value, exp);
            }

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

        // While expressions
        if (exp[0] === 'while') {
            const [_tag, condition, body] = exp;

            // Type of new value should be the same as initial type
            const t1 = this.tc(condition, env);
            this._expect(t1, Type.boolean, condition, exp);

            return this.tc(body, env);
        }

        // Function declaration
        if (exp[0] === 'def') {
            // Transpile to the variable declaration

            const varExp = this._transformDefToVarLambda(exp);
            const name   = exp[1];
            const params = exp[2];
            const returnTypeStr = exp[4];

            // We need to preinstall function into environment before
            // typechecking the body to support recursive calls.
            const paramTypes = params.map(([name, typeStr]) =>
                Type.fromString(typeStr)
            );

            env.define(
                name,
                new Type.Function({
                    paramTypes,
                    returnType: Type.fromString(returnTypeStr)
                })
            );
            
            return this.tc(varExp, env);
        }

        // Lambda functions
        if (exp[0] === 'lambda') {
            const [_tag, param, _retDel, returnTypeStr, body] = exp;
            return this._tcFunction(param, returnTypeStr, body, env);
        }

        // Function calls
        if (Array.isArray(exp)) {
            const fn = this.tc(exp[0], env);
            const argValues = exp.slice(1);

            const argTypes = argValues.map(arg => this.tc(arg, env));

            return this._checkFunctionCall(fn, argTypes, env, exp);
        }
    }

    _transformDefToVarLambda(exp) {
        const [_tag, name, params, _retDel, returnTypeStr, body] = exp;
        return ['var', name, ['lambda', params, _retDel, returnTypeStr, body]];
    }

    _checkFunctionCall(fn, argTypes, env, exp) {
        if (fn.paramTypes.length !== argTypes.length) {
            throw `Function ${fn.getName()} expects ${fn.paramTypes.length} arguments, but ${
            argTypes.length} were given in ${exp}.`;
        }

        argTypes.forEach((argType, index) => {
            this._expect(argType, fn.paramTypes[index], argType[index], exp);
        })

        return fn.returnType;
    }

    _tcFunction(params, returnTypeStr, body, env) {
        const returnType = Type.fromString(returnTypeStr);

        const paramRecord = {};
        const paramTypes = [];

        params.forEach(([name, typeStr]) => {
            const paramType = Type.fromString(typeStr);
            paramRecord[name] = paramType;
            paramTypes.push(paramType);
        });

        const fnEnv = new TypeEnvironment(paramRecord, env);

        const actualReturnType = this._tcBody(body, fnEnv);

        if (!returnType.equals(actualReturnType)) {
            throw `Expected function ${body} to return ${returnType}, but got ${actualReturnType}.`;
        }

        return new Type.Function({
            paramTypes,
            returnType
        })
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
                return [Type.number];
            case '/':
                return [Type.number];
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
        if (actual instanceof Type.Union) {
            if (actual.includesAll(allowedTypes)) {
                return;
            }
        } else if (allowedTypes.some(t => t.equals(actual))) {
            return;
        }
        throw `Unexpected type: ${actual} in ${exp}. Allowed: ${allowedTypes}`;
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
