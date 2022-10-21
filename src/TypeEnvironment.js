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
        if (!this.record.hasOwnProperty(name)) {
            throw new ReferenceError(`Undefined variable ${name}.`);
        }

        return this.record[name];
    }
}

module.exports = TypeEnvironment;
