import path from 'path';

import store from '../store/store.js';

const DataStore = require('nedb');

/**
 * Tests if given param is JSON.
 *
 * https://gist.github.com/gaibz/84a3148a278907da6072162ec8223c0b
 * @param {*} item Item to test.
 * @returns {boolean}
 */
function isJson(item) {
    item = typeof item !== "string" ?
        JSON.stringify(item) :
        item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

/**
 * Class responsible for managing database connections.
 */
export class DatabaseManager {
    constructor () {
        this.itemsDb    = null;
        this.tagsDb     = null;
        this.categoryDb = null;
        this.encryption = null;
        this.dbPath     = null;
    }

    /**
     * Sets encryption class.
     *
     * @param {Encryption} encryption Encryption class.
     */
    setEncryption (encryption) {
        this.encryption = encryption;
    }

    /**
     * Sets path to the database manually. If not set it will be read from the store.
     *
     * @param {string} dbPath
     */
    setDbPath (dbPath) {
        this.dbPath = dbPath;
    }

    /**
     * Returns path to the database.
     *
     * @returns {string}
     */
    getDbPath () {
        if (!this.dbPath) {
            this.dbPath = store.getters.dbFile;
        }

        return this.dbPath;
    }

    /**
     * Returns database responsible for storing items.
     *
     * @returns {DataStore}
     */
    getItemsDb () {
        if (this.itemsDb) {
            return this.itemsDb;
        }

        if (!this.encryption) {
            throw new Error('DatabaseManager: Encryption class not set.');
        }

        const dbPath = this.getDbPath();

        if (!dbPath) {
            throw new Error('DatabaseManager: DB Path not set.');
        }

        this.itemsDb = new DataStore(this._getDbParams(path.join(dbPath, 'items.db')));

        return this.itemsDb;
    }

    /**
     * Returns database responsible for storing tags.
     *
     * @returns {DataStore}
     */
    getTagsDb () {
        if (this.tagsDb) {
            return this.tagsDb;
        }

        if (!this.encryption) {
            throw new Error('DatabaseManager: Encryption class not set.');
        }

        const dbPath = this.getDbPath();

        if (!dbPath) {
            throw new Error('DatabaseManager: DB Path not set.');
        }

        this.tagsDb = new DataStore(this._getDbParams(path.join(dbPath, 'tags.db')));

        return this.tagsDb;
    }

    /**
     * Returns database responsible for storing categories.
     *
     * @returns {DataStore}
     */
    getCategoryDb () {
        if (this.categoryDb) {
            return this.categoryDb;
        }

        if (!this.encryption) {
            throw new Error('DatabaseManager: Encryption class not set.');
        }

        const dbPath = this.getDbPath();

        if (!dbPath) {
            throw new Error('DatabaseManager: DB Path not set.');
        }

        this.categoryDb = new DataStore(this._getDbParams(path.join(dbPath, 'categories.db')));

        return this.categoryDb;
    }

    /**
     * Returns configuration object for the database.
     *
     * @param {string} dbPath Path to the database.
     * @returns {Object}
     * @private
     */
    _getDbParams (dbPath) {
        return {
            filename             : dbPath,
            autoload             : true,
            afterSerialization   : doc => {
                if (isJson(doc)) {
                    return this.encryption.encryptText(JSON.stringify(doc));
                }
                return doc;
            },
            beforeDeserialization : doc => {
                try {
                    return JSON.parse(this.encryption.decryptText(doc));
                } catch (e) {
                    return doc;
                }
            }
        };
    }

    /**
     * Creates index on the database.
     *
     * @param {string} databaseName Database name.
     * @param {Object} indexParams Index params.
     */
    createIndex (databaseName, indexParams) {
        return new Promise((resolve, reject) => {
            const indexCb = err => {
                if (err) reject(err);
                else resolve();
            };

            switch (databaseName) {
                case 'items':
                    this.getItemsDb().ensureIndex(indexParams, indexCb);
                    break;
                case 'tags':
                    this.getTagsDb().ensureIndex(indexParams, indexCb);
                    break;
                case 'categories':
                    this.getCategoryDb().ensureIndex(indexParams, indexCb);
                    break;
                default:
                    reject(Error('Unknown database name!'));
                    break;
            }
        });
    }

    /**
     * Finds all objects in the given database.
     *
     * @param {DataStore} db Database to query.
     * @param {Object} params Params for the query.
     * @returns {Promise<Object>}
     */
    static findAll (db, params = {}) {
        return new Promise((resolve, reject) => {
            db.find(params, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    /**
     * Counts all objects in the given database.
     *
     * @param {DataStore} db Database to query.
     * @param {Object} params Params for the query.
     * @returns {Promise<number>}
     */
    static countAll (db, params = {}) {
        return new Promise((resolve, reject) => {
            db.count(params, (err, total) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(total);
                }
            });
        });
    }

    /**
     * Inserts document into the given database.
     *
     * @param {DataStore} db Database to query.
     * @param {Object} doc Document to insert.
     * @returns {Promise<Object>}
     */
    static insert (db, doc) {
        return new Promise((resolve, reject) => {
            db.insert(doc, (err, newDoc) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(newDoc);
                }
            });
        });
    }
}

export default new DatabaseManager();