import fs, {promises as fsPromises} from 'fs';
import path from 'path';
import {nativeImage} from 'electron';

import itemRepository from '../repository/ItemRepository.js';
import store from '../store/store.js';
import encryptionManager from '../lib/EncryptionManager.js';

/**
 * Operation responsible for saving item data to database.
 */
export default class {
    /**
     * Constructor.
     *
     * @param {string|null} id ID of the item in database (if null new item will be inserted)
     * @param {Object} itemData Data to insert or update.
     * @param {[{image: NativeImage}]} screenshots Screenshots.
     * @param {string} avatarImage Image URL used for avatar.
     */
    constructor (id, itemData, screenshots, avatarImage) {
        this.id          = id;
        this.itemData    = itemData;
        this.screenshots = screenshots;
        this.avatarImage = avatarImage;
    }

    /**
     * Saves item data to database.
     *
     * @returns {Promise<Object, Error>}
     */
    async save () {
        let dataToSave = {...this.itemData}; // copy not to damage original object
        dataToSave.screenshots = [];

        for (let i = 0; i < this.screenshots.length; i++) {
            const size = this.screenshots[i].image.getSize();
            let screen = {name: i + '_screen.jpg.enc', width: size.width, height: size.height};

            dataToSave.screenshots.push(screen);
        }

        if (!this.id) {
            const item = await itemRepository.insert(dataToSave);
            this.id    = item._id;
        } else {
            itemRepository.update(this.id, dataToSave);
        }

        await this._saveImages();

        await store.dispatch('addTags', dataToSave.tags);

        dataToSave._id         = this.id;
        dataToSave.avatarImage = this.avatarImage;

        return dataToSave;
    }

    /**
     * Saves images to encrypted files.
     *
     * @returns {Promise<void>}
     * @private
     */
    async _saveImages() {
        const dbPath = store.getters.dbFile;
        const dataPath = path.join(dbPath, 'data', this.id);
        const imageQuality = store.getters.settings.imageQuality;

        console.log(imageQuality);

        if (this.avatarImage || this.screenshots.length > 0) {
            if (!fs.existsSync(dataPath)) {
                if (!fs.existsSync(path.join(dbPath, 'data'))) {
                    await fsPromises.mkdir(path.join(dbPath, 'data'));
                }

                await fsPromises.mkdir(dataPath);
            }

            await this._clearFolder(dataPath);

            if (this.screenshots.length > 0) {
                for (let i = 0; i < this.screenshots.length; i++) {
                    await encryptionManager.getEncryption().saveBuffer(this.screenshots[i].image.toJPEG(imageQuality), path.join(dataPath, i + '_screen.jpg.enc'));
                    //await fsPromises.writeFile(path.join(dataPath, i + '_screen.jpg'), this.screenshots[i].image.toJPEG(85));
                }
            }

            if (this.avatarImage) {
                const avatarNative = nativeImage.createFromDataURL(this.avatarImage);
                await encryptionManager.getEncryption().saveBuffer(avatarNative.toJPEG(imageQuality), path.join(dataPath, 'avatar.jpg.enc'));
            }
        } else {
            if (fs.existsSync(dataPath)) {
                // no images to save - can delete folder
                await this._clearFolder(dataPath);

                await fsPromises.rmdir(dataPath);
            }
        }
    }

    /**
     * Deletes all files in the directory.
     *
     * @param {string} dir Directory do delete files.
     * @returns {Promise<void>}
     * @private
     */
    async _clearFolder (dir) {
        const files = await fsPromises.readdir(dir);

        for (let file of files) {
            if (file.charAt(0) !== '.') {
                await fsPromises.unlink(path.join(dir, file));
            }
        }
    }
};