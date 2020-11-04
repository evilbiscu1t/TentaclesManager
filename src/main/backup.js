import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import moment from "moment";

/**
 * Async check if file exists.
 *
 * @param {string} file File to check.
 * @return {Promise<unknown>}
 */
async function fileExists(file) {
    return new Promise(resolve => {
        fs.access(file, fs.constants.W_OK, err => resolve(!err));
    });
}

/**
 * Deletes oldest backup files to keep only certain number of files in backup folder.
 *
 * @param {string} dbPath Path to database.
 * @return {Promise<void>}
 */
async function deleteOldFiles(dbPath) {
    const backupPath = path.join(dbPath, 'backup');

    let files = await fs.promises.readdir(backupPath);
    files = files.filter(fileName => {
        return fileName.startsWith('backup') && fileName.endsWith('.zip');
    });
    files = files.sort((a, b) => b.localeCompare(a));

    const maxNumberOfBackups = 20; // maximum number of backups to keep
    if (files.length > maxNumberOfBackups) {
        for (let i = maxNumberOfBackups; i < files.length; i++) {
            await fs.promises.unlink(path.join(backupPath, files[i]));
        }
    }
}

/**
 * Creates backup of all database files.
 *
 * @param {string} dbPath Path to the database location.
 * @return {Promise<void>}
 */
export async function createBackup(dbPath) {
    const categoriesFile = path.join(dbPath, 'categories.db');
    const tagsFile = path.join(dbPath, 'tags.db');
    const itemsFile = path.join(dbPath, 'items.db');
    const backupPath = path.join(dbPath, 'backup');

    if (!await fileExists(backupPath)) {
        await fs.promises.mkdir(backupPath);
    }

    const backupFileName = 'backup' + moment().format('YYYYMMDDHHmmssSSS') + '.zip';
    const output         = fs.createWriteStream(path.join(backupPath, backupFileName));
    const archive        = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.pipe(output);
    if (await fileExists(categoriesFile)) {
        archive.file(categoriesFile, {name: 'categories.db'});
    }
    if (await fileExists(tagsFile)) {
        archive.file(tagsFile, {name: 'tags.db'});
    }
    if (await fileExists(itemsFile)) {
        archive.file(itemsFile, {name: 'items.db'});
    }

    await archive.finalize();
    await deleteOldFiles(dbPath);
}