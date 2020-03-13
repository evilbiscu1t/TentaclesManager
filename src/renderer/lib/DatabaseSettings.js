import {promises as fsPromises} from 'fs';
import path from 'path';

export default class {
    /**
     * Constructor.
     *
     * @param {string} path Path to where database is located.
     */
    constructor (path) {
        this.path = path;
        this.settings = {};
    }

    /**
     * Sets settings object.
     *
     * @param {Object} settings Settings object.
     * @param {boolean} settings.enableInDevelopment
     * @param {boolean} settings.enableRatings
     */
    setSettings (settings) {
        this.settings = settings;
    }

    /**
     * Returns settings object.
     *
     * @returns {{enableInDevelopment: Boolean, enableRatings: Boolean}}
     */
    getSettings () {
        return this.settings;
    }

    /**
     * Saves settings to encrypted file.
     *
     * @param {Encryption} encryption Library used to encrypt data.
     * @returns {Promise<void>}
     */
    async save(encryption) {
        const settingsFile = path.join(this.path, 'settings.json');

        await fsPromises.writeFile(settingsFile, encryption.encryptText(JSON.stringify(this.settings)));
    }

    /**
     * Loads settings from file.
     *
     * @param {Encryption} encryption Library used to decrypt settings data.
     * @returns {Promise<void>}
     */
    async load(encryption) {
        const settingsFile  = path.join(this.path, 'settings.json');
        const encryptedData = await fsPromises.readFile(settingsFile);
        const decryptedData = encryption.decryptText(encryptedData.toString('utf8'));

        this.setSettings(JSON.parse(decryptedData));
    }
};