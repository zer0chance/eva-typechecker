const TypeEnvironment = require("./TypeEnvironment");

class Type {
    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    toString() {
        return this.getName();
    }

    equals(other) {
        if (other instanceof Type.Alias) {
            return other.equals(this);
        }
        if (other instanceof Type.Union) {
            return other.equals(this);
        }
        return this.name === other.name;
    }

    static fromString(typeString) {
        if (this.hasOwnProperty(typeString)) {
            return this[typeString];
        }

        if (typeString.includes('Fn<')) {
            return Type.Function.fromString(typeString);
        }
        throw `Unknown type: ${typeString}.`;
    }
}

Type.number  = new Type('number');
Type.string  = new Type('string');
Type.boolean = new Type('boolean');
Type.null    = new Type('null');

Type.Function = class extends Type {
    constructor({name = null, paramTypes, returnType}) {
        super(name);
        this.paramTypes = paramTypes;
        this.returnType = returnType;
        this.name = this.getName();
    }

    /**
     * Returns name: Fn<returnType<p1, p2...>>
     * Fn<number>
     * Fn<numver<number,number>>
     */
    getName() {
        if (this.name === null) {
            const name = ['Fn<', this.returnType.getName()];

            if (this.paramTypes.length > 0) {
                const params = [];
                for (let i = 0; i < this.paramTypes.length; i++) {
                    params.push(this.paramTypes[i].getName());
                }
                name.push('<', params.join(','), '>')
            }
            name.push('>');
        }
        return this.name;
    }

    equals(other) {
        if (this.paramTypes.length !== other.paramTypes.length) {
            return false;
        }

        for (let i = 0; i < this.paramTypes.length; i++) {
            if (!this.paramTypes[i].equals(other.paramTypes[i])) {
                return false;
            }
        }

        if (!this.returnType.equals(other.returnType)) {
            return false;
        }

        return true;
    }

    static fromString(typeString) {
        if (this.hasOwnProperty(typeString)) {
            return this[typeString];
        }

        let matched = /^Fn<(\w+)<([a-z,\s]+)>>$/.exec(typeString);

        if (matched) {
            const [_tag, returnTypeStr, paramsStr] = matched;

            const paramTypes = paramsStr
                .split(/,\s*/g)
                .map(param => Type.fromString(param));

            return (Type[typeString] = new Type.Function({
                name: typeString,
                paramTypes,
                returnType: Type.fromString(returnTypeStr)
            }));
        }
       
        matched = /^Fn<(\w+)>$/.exec(typeString);

        if (matched) {
            const [_tag, returnTypeStr] = matched;

            return (Type[typeString] = new Type.Function({
                name: typeString,
                paramTypes: [],
                returnType: Type.fromString(returnTypeStr)
            }));
        }
    }
}

Type.Alias = class extends Type {
    constructor({name, parent}) {
        super(name);
        this.parent = parent;
    }

    equals(other) {
        if (this.name === other.name) {
            return true;
        }

        return this.parent.equals(other);
    }
}

Type.Class = class extends Type {
    constructor({name, superClass = Type.null}) {
        super(name);
        this.superClass = superClass;
        this.env = new TypeEnvironment({}, superClass != Type.null ? superClass.env : null);
    }

    getField(name) {
        return this.env.lookup(name);
    }

    equals(other) {
        if (this === other) {
            return true;
        }

        if (other instanceof Type.Alias) {
            return other.equals(this);
        }

        if (this.superClass != Type.null) {
            return this.superClass.equals(other);
        }

        return false;
    }
}

Type.Union = class extends Type {
    constructor({name, optionTypes}) {
        super(name);
        this.optionTypes = optionTypes;
    }

    includesAll(types) {
        if (types.length !== this.optionTypes.length) {
            return false;
        }
        for (const type_ of types) {
            if (!this.equals(type_)) {
                return false;
            }
        }

        return true;
    }

    equals(other) {
        if (this === other) {
            return true;
        }

        if (other instanceof Type.Alias) {
            return other.equals(this);
        }

        if (other instanceof Type.Union) {
            return this.includesAll(other.optionTypes);
        }
        
        const cmp = this.optionTypes.some(t => t.equals(other));
        return cmp;
    }
}

module.exports = Type;
