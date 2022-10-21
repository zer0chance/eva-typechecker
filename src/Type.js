
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
        throw `Unknown type: ${typeString}.`;
    }
}

Type.number  = new Type('number');
Type.string  = new Type('string');
Type.boolean = new Type('boolean');

module.exports = Type;
