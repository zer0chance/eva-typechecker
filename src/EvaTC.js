

/**
 * Static Eva typechecker.
 */
class EvaTC {

    /**
     * Validates type of expression.
     */
    tc(exp) {

        if (this._isNumber(exp)) {
            return 'number';
        }
    }

    _isNumber(exp) {
        return typeof exp === 'number';
    }
}

module.exports = EvaTC;
