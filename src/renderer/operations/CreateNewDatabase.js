import fs, {promises as fsPromises} from 'fs';
import path from 'path';

import DatabaseSettings from '../lib/DatabaseSettings.js';
import Encryption from '../lib/Encryption.js';
import databaseManager from '../lib/DatabaseManager.js';

/**
 * Operation for creation of new database.
 */
export default class {

    /**
     * Constructor.
     *
     * @param {string} path Path where database will be located.
     * @param {string} name Name for the database.
     * @param {string} password Password for the database.
     * @param {Object} options Other options
     * @param {number} options.imageQuality Quality of the screenshots stored in db
     */
    constructor (path, name, password, options) {
        this.path = path;
        this.name = name;
        this.password = password;
        this.options = options;
    }

    /**
     * Executes creation of the database. Returns promise with one of result codes:
     * ok - Database created
     * path_not_exists - Specified path dose not exists
     * path_not_directory - Specified path is not a directory
     * path_not_writable - Specified path is not writable
     * name_already_exists - Directory with specified name already exists in the given path
     *
     * @returns {Promise<string>}
     */
    async create () {
        const pathIsValid = await this._validatePath();

        if (pathIsValid !== 'ok') {
            return pathIsValid;
        }

        const nameIsValid = await this._validateName();

        if (nameIsValid !== 'ok') {
            return nameIsValid;
        }

        const fullPath   = path.join(this.path, this.name);
        const encryption = new Encryption(this.password);

        try {
            await fsPromises.mkdir(fullPath);

            const settings = new DatabaseSettings(fullPath);
            settings.setSettings(this.options);
            await settings.save(encryption);

            databaseManager.setEncryption(encryption);
            databaseManager.setDbPath(fullPath);

            await databaseManager.createIndex('items', {fieldName: 'tags'});
            await databaseManager.createIndex('items', {fieldName: 'category.id'});
        } catch (e) {
            console.log(e);
            return 'unknown_error' // this should not happen since permissions are already checked
        }

        return 'ok';
    }

    /**
     * Checks if the given name is correct and not existing in the given path.
     *
     * @returns {Promise<string>}
     * @private
     */
    async _validateName () {
        const fullPath = path.join(this.path, this.name);

        try {
            await fsPromises.access(fullPath, fs.constants.F_OK);

            return 'name_already_exists';
        } catch (e) {
            return 'ok';
        }
    }

    /**
     * Checks if the path is valid.
     *
     * @returns {Promise<string>}
     * @private
     */
    async _validatePath () {
        try {
            const stat = await fsPromises.lstat(this.path);

            if (!stat.isDirectory()) {
                return 'path_not_directory';
            }
        } catch (e) {
            return 'path_not_exists';
        }

        try {
            await fsPromises.access(this.path, fs.constants.R_OK | fs.constants.W_OK);

            return 'ok';
        } catch (e) {
            return 'path_not_writable';
        }
    }
};