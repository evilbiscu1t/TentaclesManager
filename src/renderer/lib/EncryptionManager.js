/**
 * Object responsible for managing encryption object.
 */
export default {
    /**
     * @private
     * @property {Encryption}
     */
    _encryption : null,

    /**
     * Sets encryption object.
     *
     * @param {Encryption} encryption
     */
    setEncryption (encryption) {
        this._encryption = encryption;
    },

    /**
     * Returns encryption object.
     *
     * @returns {Encryption}
     */
    getEncryption () {
        return this._encryption;
    }
};