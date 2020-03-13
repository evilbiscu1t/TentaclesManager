import DatabaseSettings from '../lib/DatabaseSettings.js';
import Encryption from '../lib/Encryption.js';
import store from '../store/store.js';

import databaseManager from '../lib/DatabaseManager.js';
import encryptionManager from '../lib/EncryptionManager.js';

/**
 * Class for loading data from database after unlock.
 */
export default class {
    /**
     * Constructor.
     *
     * @param {string} path Path to the database location.
     * @param {string} password Password for the database.
     */
    constructor (path, password) {
        this.path     = path;
        this.password = password;
    }

    /**
     * Unlocks the database and sets up all data sources. Throws an error if password is incorrect or something goes wrong.
     *
     * @returns {Promise<void>}
     */
    async unlockAndLoadData () {
        const settings   = new DatabaseSettings(this.path);
        const encryption = new Encryption(this.password);

        await settings.load(encryption);

        databaseManager.setEncryption(encryption);
        encryptionManager.setEncryption(encryption);

        await store.dispatch('setSettings', settings.getSettings());
    }
};