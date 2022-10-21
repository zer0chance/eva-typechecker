/**
 * Mapings from name to types.
 */
class TypeEnvironment {
    /**
     * Creates an environment with a given record.
     */
    constructor(record = {}, parent = null) {
        this.record = record;
        this.parent = parent;
    }

    /**
     * Creates a variable with a given type.
     */
    define(name, type) {
        this.record[name] = type;
        return type;
    }

    /**
     * Returns the type of variable or thrown undefined variable.
     */
    lookup(name) {
        return this.resolve(name).record[name];
    }

    /**
     * Resolve identifier name and returns it's envirinment. 
     */
    resolve(name) {
        if (this.record.hasOwnProperty(name)) {
            return this;
        }

        if (this.parent === null) {
            throw new ReferenceError(`Undefined variable "${name}".`);
        }

        return this.parent.resolve(name);
    }
}

module.exports = TypeEnvironment;
