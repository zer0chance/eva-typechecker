
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

module.exports = Type;
