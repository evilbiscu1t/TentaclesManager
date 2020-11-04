import fs from 'fs';
import path from 'path';
import lineReader from 'line-reader';

import encryptionManager from '../lib/EncryptionManager.js';

/**
 * Class for fixing database structure if it become corrupted.
 */
export default class {
    /**
     * Constructor.
     *
     * @param {string} path Path to the database location.
     * @param {string} password Password for the database.
     */
    constructor (path, password) {
        this.path = path;
        this.password = password;
        this.totalLines = 0;
        this.removedLines = 0;

    }

    async fixDatabase() {
        const tmpPath = path.join(this.path, 'tmp');

        if (!await this._fileExists(tmpPath)) {
            await fs.promises.mkdir(tmpPath);
        }

        if (await this._fileExists(path.join(this.path, 'items.db'))) {
            if (await this._copyFixedFile('items.db')) {
                await fs.promises.unlink(path.join(this.path, 'items.db'));
                await fs.promises.rename(path.join(tmpPath, 'items.db'), path.join(this.path, 'items.db'));
            }
        }
        if (await this._fileExists(path.join(this.path, 'tags.db'))) {
            if (await this._copyFixedFile('tags.db')) {
                await fs.promises.unlink(path.join(this.path, 'tags.db'));
                await fs.promises.rename(path.join(tmpPath, 'tags.db'), path.join(this.path, 'tags.db'));
            }
        }
        if (await this._fileExists(path.join(this.path, 'categories.db'))) {
            if (await this._copyFixedFile('categories.db')) {
                await fs.promises.unlink(path.join(this.path, 'categories.db'));
                await fs.promises.rename(path.join(tmpPath, 'categories.db'), path.join(this.path, 'categories.db'));
            }
        }

        await fs.promises.rmdir(tmpPath, {recursive: true});

        return {total: this.totalLines, removed: this.removedLines};
    }

    async _copyFixedFile(fileName) {
        const fullFilePath = path.join(this.path, fileName);
        const fullTmpFilePath = path.join(this.path, 'tmp', fileName);

        const stats = fs.statSync(fullFilePath)
        if (!stats["size"]) {
            // file is empty
            return Promise.resolve(false);
        }

        const writeStream = fs.createWriteStream(fullTmpFilePath);

        return new Promise(resolve => {
            lineReader.eachLine(fullFilePath, (line, last, cb) => {
                this.totalLines++;

                if (this._isLineOk(line)) {
                    writeStream.write(line + "\n", () => {
                        cb();

                        if (last) {
                            resolve();
                            writeStream.close();
                        }
                    });
                } else {
                    this.removedLines++;

                    cb();

                    if (last) {
                        resolve(true);
                        writeStream.close();
                    }
                }
            });
        });
    }

    _isLineOk(line) {
        try {
            JSON.parse(line);
            encryptionManager.getEncryption().decryptText(line);
        } catch (e) {
            return false;
        }

        return true;
    }

    async _fileExists(file) {
        return new Promise(resolve => {
            fs.access(file, fs.constants.W_OK, err => resolve(!err));
        });
    }
}