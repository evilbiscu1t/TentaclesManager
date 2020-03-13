import fs from 'fs-extra';
import path from 'path';

import Encryption from '../lib/Encryption.js';
import {DatabaseManager} from '../lib/DatabaseManager.js';
import DatabaseSettings from '../lib/DatabaseSettings';

/**
 * Class with code to perform password change operation and re-encryption of the whole database.
 */
export default class {
    /**
     * Constructor.
     *
     * @param {string} dbPath Path to the database.
     * @param {string} oldPassword Current database password.
     * @param {string} newPassword New password.
     */
    constructor (dbPath, oldPassword, newPassword) {
        this.dbPath           = dbPath;
        this.oldEncryption    = new Encryption(oldPassword);
        this.newEncryption    = new Encryption(newPassword);
        this.progressCallback = null;
        this.currentStep      = 0;
        this.totalSteps       = 0;
    }

    /**
     * Executes the operation.
     *
     * @param {Function} progressCallback Callback that will revive progress updates.
     * @returns {Promise<void>}
     */
    async execute (progressCallback) {
        this.progressCallback = progressCallback;

        const currentSettings = new DatabaseSettings(this.dbPath);
        await currentSettings.load(this.oldEncryption);

        const currentDbMgr = new DatabaseManager();
        currentDbMgr.setDbPath(this.dbPath);
        currentDbMgr.setEncryption(this.oldEncryption);

        await this._calculateTotalSteps(currentDbMgr);

        const tmpPath = path.join(this.dbPath, 'tmp');
        await fs.ensureDir(tmpPath);
        await fs.emptyDir(tmpPath);

        this.currentStep++;
        this._notifyCallback();

        const newDbMgr = new DatabaseManager();
        newDbMgr.setDbPath(tmpPath);
        newDbMgr.setEncryption(this.newEncryption);

        await this._copyTags(currentDbMgr, newDbMgr);

        const categoryIdsMap = await this._copyCategories(currentDbMgr, newDbMgr);

        await this._copyItems(currentDbMgr, newDbMgr, categoryIdsMap);

        const newSettings = new DatabaseSettings(path.join(this.dbPath, 'tmp'));
        newSettings.setSettings(currentSettings.getSettings());
        await newSettings.save(this.newEncryption);

        await this._moveFiles();

        this.progressCallback = null;
        this.currentStep      = 0;
        this.totalSteps       = 0;
    }

    /**
     * Moves newly encrypted files to their new location.
     *
     * @returns {Promise<void>}
     * @private
     */
    async _moveFiles () {
        const tmpPath  = path.join(this.dbPath, 'tmp');

        await fs.unlink(path.join(this.dbPath, 'settings.json'));

        if (fs.existsSync(path.join(this.dbPath, 'items.db'))) {
            await fs.unlink(path.join(this.dbPath, 'items.db'));
            await fs.move(path.join(tmpPath, 'items.db'), path.join(this.dbPath, 'items.db'));
        }

        if (fs.existsSync(path.join(this.dbPath, 'categories.db'))) {
            await fs.unlink(path.join(this.dbPath, 'categories.db'));
            await fs.move(path.join(tmpPath, 'categories.db'), path.join(this.dbPath, 'categories.db'));
        }

        if (fs.existsSync(path.join(this.dbPath, 'tags.db'))) {
            await fs.unlink(path.join(this.dbPath, 'tags.db'));
            await fs.move(path.join(tmpPath, 'tags.db'), path.join(this.dbPath, 'tags.db'));
        }

        const dataPath = path.join(this.dbPath, 'data');
        await fs.remove(dataPath);

        await fs.move(path.join(tmpPath, 'data'), dataPath);
        await fs.move(path.join(tmpPath, 'settings.json'), path.join(this.dbPath, 'settings.json'));

        await fs.remove(tmpPath);
    }

    /**
     * Copies tags to the new database.
     *
     * @param {DatabaseManager} oldDbManager Old database manager.
     * @param {DatabaseManager} newDbManager New Database manager.
     * @returns {Promise<void>}
     * @private
     */
    async _copyTags (oldDbManager, newDbManager) {
        const tags  = await DatabaseManager.findAll(oldDbManager.getTagsDb());
        const newDb = newDbManager.getTagsDb();

        for (let tag of tags) {
            await DatabaseManager.insert(newDb, tag);

            this.currentStep++;
            this._notifyCallback();
        }
    }

    /**
     * Copies categories from one db to the other. Returns map of changed ids.
     *
     * @param {DatabaseManager} oldDbManager Old database manager.
     * @param {DatabaseManager} newDbManager New Database manager.
     * @returns {Promise<Map<string, string>>}
     * @private
     */
    async _copyCategories (oldDbManager, newDbManager) {
        const idMap      = new Map();
        const newDb      = newDbManager.getCategoryDb();
        const categories = await DatabaseManager.findAll(oldDbManager.getCategoryDb());

        for (let category of categories) {
            const newCat = await DatabaseManager.insert(newDb, category);

            idMap.set(category._id, newCat._id);

            this.currentStep++;
            this._notifyCallback();
        }

        return idMap;
    }

    /**
     * Copies items from one db to the other.
     *
     * @param {DatabaseManager} oldDbManager Old database manager.
     * @param {DatabaseManager} newDbManager New Database manager.
     * @param {Map<string, string>} categoryIdsMap Map of changed category ids.
     * @returns {Promise<void>}
     * @private
     */
    async _copyItems (oldDbManager, newDbManager, categoryIdsMap) {
        const newDb       = newDbManager.getItemsDb();
        const items       = await DatabaseManager.findAll(oldDbManager.getItemsDb());
        const tmpDataPath = path.join(this.dbPath, 'tmp', 'data');
        const dataPath    = path.join(this.dbPath, 'data');

        await newDbManager.createIndex('items', {fieldName: 'tags'});
        await newDbManager.createIndex('items', {fieldName: 'category.id'});

        await fs.ensureDir(tmpDataPath);

        for (let item of items) {
            if (item.category && categoryIdsMap.has(item.category.id)) {
                item.category.id = categoryIdsMap.get(item.category.id); // replacing changed category ID
            }

            const newItem = await DatabaseManager.insert(newDb, item);

            if (item.screenshots.length || item.avatar) {
                const screensDir = path.join(tmpDataPath, newItem._id);

                await fs.ensureDir(screensDir);

                for (let screen of item.screenshots) {
                    const screenBuffer = await this.oldEncryption.readBuffer(path.join(dataPath, item._id, screen.name));

                    await this.newEncryption.saveBuffer(screenBuffer, path.join(screensDir, screen.name));
                }

                if (item.avatar) {
                    const avatarBuffer = await this.oldEncryption.readBuffer(path.join(dataPath, item._id, 'avatar.jpg.enc'));

                    await this.newEncryption.saveBuffer(avatarBuffer, path.join(screensDir, 'avatar.jpg.enc'));
                }
            }

            this.currentStep++;
            this._notifyCallback();
        }
    }

    /**
     * Calculates all steps required to change database password.
     *
     * @param {DatabaseManager} dbManager Database manager used for queries.
     * @returns {Promise<number>}
     * @private
     */
    async _calculateTotalSteps (dbManager) {
        let total = 1;

        total += await DatabaseManager.countAll(dbManager.getTagsDb());
        total += await DatabaseManager.countAll(dbManager.getCategoryDb());
        total += await DatabaseManager.countAll(dbManager.getItemsDb());

        this.totalSteps = total;

        return total;
    }

    /**
     * Notifies callback about current progress.
     *
     * @private
     */
    _notifyCallback () {
        this.progressCallback(Math.ceil((parseFloat(this.currentStep) / this.totalSteps) * 100));
    }
};