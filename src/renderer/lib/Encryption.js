import crypto from 'crypto';
import { Buffer } from 'buffer';
import { Transform, PassThrough } from 'stream';
import fs from 'fs';

/**
 * Helper class to append init vector to the file.
 */
class AppendInitVector extends Transform {
    /**
     * Constructor.
     *
     * @param {string} initVector init vector to append.
     * @param {Object} [opts] Other options.
     */
    constructor(initVector, opts) {
        super(opts);
        this.initVector = initVector;
        this.appended   = false;
    }

    _transform(chunk, encoding, cb) {
        if (!this.appended) {
            this.push(this.initVector);
            this.appended = true;
        }
        this.push(chunk);
        cb();
    }
}

/**
 * Class dedicated to handle all of low level encryption processes.
 */
export default class Encryption {
    /**
     * Constructor.
     *
     * @param {string} password Password used to encrypt data.
     */
    constructor (password) {
        this.password = password;
        this.key      = crypto.createHash('sha256').update(password).digest();
    }

    /**
     * Simple text encryption.
     *
     * @param {string} text Text to encrypt.
     * @returns {string} Encrypted text.
     */
    encryptText (text) {
        const initVector = crypto.randomBytes(16);
        const cipher     = crypto.createCipheriv('aes-256-cbc', this.key, initVector);
        let cipherText   = cipher.update(text, 'utf8');

        cipherText = Buffer.concat([cipherText, cipher.final()]);

        return JSON.stringify({iv: initVector.toString('hex'), data: cipherText.toString('hex')});
    }

    /**
     * Decryption of a text encrypted with encryptText method.
     *
     * @param {string} text Text to decrypt.
     * @returns {string}
     */
    decryptText (text) {
        const data = JSON.parse(text);

        const iv            = Buffer.from(data.iv, 'hex');
        const encryptedText = Buffer.from(data.data, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
        let decrypted  = decipher.update(encryptedText);
        decrypted      = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }

    /**
     * Saves buffer data to file encrypting it on the way.
     *
     * @param {Buffer} buffer buffer with data to save.
     * @param {string} file Path to the file.
     * @returns {Promise<void, Error>}
     */
    saveBuffer (buffer, file) {
        return new Promise((resolve, reject) => {
            const initVector       = crypto.randomBytes(16);
            const cipher           = crypto.createCipheriv('aes-256-cbc', this.key, initVector);
            const appendInitVector = new AppendInitVector(initVector);

            const writeStream  = fs.createWriteStream(file);
            const bufferStream = new PassThrough();
            bufferStream.end(buffer);

            bufferStream.pipe(cipher)
                .pipe(appendInitVector)
                .pipe(writeStream)
                .on('error', err => {
                    reject(err);
                })
                .on('finish', () => {
                    resolve();
                });
        });
    }

    /**
     * Reads encrypted file.
     *
     * @param {string} file Path to the file.
     * @returns {Promise<Buffer, Error>}
     */
    readBuffer (file) {
        return new Promise((resolve, reject) => {
            this._readIvFromFile(file).then(initVector => {
                const readStream = fs.createReadStream(file, { start: 16 });
                const decipher   = crypto.createDecipheriv('aes-256-cbc', this.key, initVector);

                const data = [];
                readStream.pipe(decipher)
                    .on('error', err => {
                        reject(err);
                    })
                    .on('data', chunk => {
                        data.push(chunk);
                    })
                    .on('end', () => {
                        resolve(Buffer.concat(data));
                    });
            }, err => reject(err));
        });
    }

    /**
     * Reads init vector from file saved with saveBuffer method.
     *
     * @param {string} file Path to file.
     * @returns {Promise<Buffer, Error>}
     * @private
     */
    _readIvFromFile (file) {
        return new Promise((resolve, reject) => {
            const readIv = fs.createReadStream(file, { end: 15 });

            let initVector;
            readIv.on('data', (chunk) => {
                initVector = chunk;
            });

            readIv.on('error', error => {
                reject(error);
            });

            readIv.on('close', () => {
                resolve(initVector);
            });
        });
    }
}