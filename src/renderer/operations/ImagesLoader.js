import path from 'path';
import fs from 'fs';
import {nativeImage} from 'electron';

import encryptionManager from '../lib/EncryptionManager.js';
import store from '../store/store.js';

/**
 * Adds avatarImage property to the array passed as an argument.
 *
 * @param {Array} items Items array.
 * @returns {Promise<boolean>}
 */
export async function loadAvatars(items) {
    const dbPath = store.getters.dbFile;

    for (let item of items) {
        if (item.avatar) {
            const avatarFile = path.join(dbPath, 'data', item._id, 'avatar.jpg.enc');

            if (fs.existsSync(avatarFile)) {
                const avatar       = await encryptionManager.getEncryption().readBuffer(avatarFile);
                const avatarNative = nativeImage.createFromBuffer(avatar);

                item.avatarImage = avatarNative.toDataURL();
            }
        }
    }

    return true;
}

/**
 * Loads screenshots for the item.
 *
 * @param {Object} item Items data.
 * @returns {Promise<NativeImage[]>}
 */
export async function loadScreenshots(item) {
    const screensPath = path.join(store.getters.dbFile, 'data', item._id);
    let result = [];

    for (let scr of item.screenshots) {
        const screenFile = path.join(screensPath, scr.name);

        if (fs.existsSync(screenFile)) {
            const screen       = await encryptionManager.getEncryption().readBuffer(screenFile);
            const screenNative = nativeImage.createFromBuffer(screen);

            result.push(screenNative);
        }
    }

    return result;
}