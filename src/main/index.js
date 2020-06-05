import { app, BrowserWindow, dialog, Menu } from 'electron';
import path from 'path';
import { format as formatUrl } from 'url';
import querystring from 'querystring';
import fs from 'fs';
import fetch from 'node-fetch';
import domparser from "html-dom-parser";

import applicationMenu from './application-menu.js';

const isDevelopment = process.env.NODE_ENV !== 'production';
const appWindows    = new Map();

/**
 * Downloads metadata from F95 topic.
 *
 * TODO: extract to separate file?
 * @param {string} topicPath Path to the topic.
 * @param {function} callback Callback to call after data is parsed.
 */
export function downloadF95Metadata(topicPath, callback) {
    fetch('https://f95zone.to/threads/' + topicPath)
        .then(res => res.text())
        .then(body => {
            let match     = body.match(/<li class="groupedTags">(.|\s)+?<\/li>/m);
            let tagsList  = [];
            let title     = '';
            let completed = false;
            let version   = '';

            if (match) {
                const tagsDom = domparser(match[0]);

                if (tagsDom && tagsDom.length) {
                    for (let tag of tagsDom[0].children) {
                        if (tag.name === 'a') {
                            if (tag.children && tag.children.length && tag.children[0].type === 'text') {
                                tagsList.push(tag.children[0].data);
                            }
                        }
                    }
                }
            }

            match = body.match(/<h1 class="p-title-value">(.|\s)+?<\/h1>/m);

            if (match) {
                const titleDom = domparser(match[0]);
                let titleText  = '';

                if (titleDom && titleDom.length) {
                    for (let elem of titleDom[0].children) {
                        if (elem.type === 'text') {
                            titleText = elem.data;
                        } else if (elem.name === 'a') {
                            if (elem.children && elem.children.length) {
                                if (elem.children[0].name === 'span' && elem.children[0].children && elem.children[0].children.length) {
                                    if (elem.children[0].children[0].type === 'text' && elem.children[0].children[0].data.toLowerCase() === '[completed]') {
                                        completed = true;
                                    }
                                }
                            }
                        }
                    }
                }

                let versionMatch = titleText.match(/\[(.+?)\]/);
                if (versionMatch) {
                    version = versionMatch[1];
                }

                if (titleText.indexOf('[') > 0) {
                    titleText = titleText.substring(0, titleText.indexOf('['));
                }

                title = titleText.trim();
            }

            callback({
                title,
                version,
                tags : tagsList,
                completed,
            });
        });
}

/**
 * Opens new app window.
 *
 * @param {string} target Target for render process to display in window.
 * @param {Object} windowParams Params for Electron window.
 * @param {Object} [params] Params for window script.
 * @param {boolean} [showOnReady] If window has to be shown when it's ready (if false it will be shown immediately after creating)
 */
export function openWindow (target, windowParams, params = {}, showOnReady = true) {
    return new Promise(resolve => {
        const query     = {target, ...params};
        const windowKey = querystring.stringify(query);

        if (appWindows.has(windowKey)) {
            appWindows.get(windowKey).focus();
            resolve();
            return;
        }

        let window = new BrowserWindow(windowParams);

        if (isDevelopment) {
            window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}?` + windowKey);
        } else {
            window.loadURL(formatUrl({
                pathname : path.join(__dirname, 'index.html'),
                protocol : 'file',
                slashes  : true,
                query
            }));
        }

        window.once('show', resolve);

        if (showOnReady) {
            window.once('ready-to-show', () => {
                window.show();
            });
        } else {
            window.show();
        }

        window.on('closed', () => {
            if (appWindows.has(windowKey)) {
                appWindows.delete(windowKey);
            }
        });

        appWindows.set(windowKey, window);
    });
}

/**
 * Shows open directory dialog. Returns path to selected directory or null if selection was canceled.
 *
 * @param {BrowserWindow} browserWindow Browser window that invoked operation.
 * @returns {Promise<Electron.OpenDialogReturnValue>}
 */
export function chooseDirectory (browserWindow) {
    return dialog.showOpenDialog(browserWindow, {
        properties : ['openDirectory'],
    });
}

/**
 * Shows dialog to choose images. Returns array of selected images or null if none was selected.
 *
 * @param {BrowserWindow} browserWindow Browser window that invoked operation.
 * @param {string} filterName Tekst to display in filters menu.
 * @param {boolean} multiSelect If true multi selection will be enabled.
 * @returns {Promise<Electron.OpenDialogReturnValue>}
 */
export function chooseImages(browserWindow, filterName, multiSelect = true) {
    let properties = ['openFile'];

    if (multiSelect) {
        properties.push('multiSelections');
    }

    return dialog.showOpenDialog(browserWindow, {
        properties,
        filters   : [
            {name: filterName, extensions: ['png', 'jpg', 'jpeg']}
        ]
    });
}

/**
 * Opens main application window.
 *
 * @param {string} dbPath Database path.
 * @param {string} dbName Database name.
 * @returns {string}
 */
export function openMainWindow(dbPath, dbName) {
    const dbFile = path.join(dbPath, dbName);

    if (!fs.existsSync(dbFile)) {
        return 'db_not_exists';
    }

    openWindow('mainWindow', {
        width          : 1250,
        height         : 800,
        show           : false,
        title          : dbName,
        webPreferences : {
            nodeIntegration: true
        },
    }, {dbFile}).then(closeWelcomeWindow);

    return 'ok';
}

/**
 * Closes main application window (if is opened) for selected database.
 *
 * @param {string} dbPath Path to the database file.
 * @param {string} dbName Name of the database.
 */
export function closeMainWindow(dbPath, dbName) {
    const dbFile = path.join(dbPath, dbName);
    const query     = {target: 'mainWindow', dbFile};
    const windowKey = querystring.stringify(query);

    if (appWindows.has(windowKey)) {
        appWindows.get(windowKey).close();
    }
}

/**
 * Method that handles the event of database creation.
 *
 * @param {BrowserWindow} browserWindow Browser window that invoked operation.
 * @param {string} dbName Name of the database that was created.
 * @param {string} dbPath Path in which database is located.
 */
export function newDatabaseCreated(browserWindow, dbName, dbPath) {
    browserWindow.close();

    const windowKey = querystring.stringify({target: 'welcomeWindow'});

    if (appWindows.has(windowKey)) {
        appWindows.get(windowKey).webContents.send('new-db-created', {dbName, dbPath});
    }

    openMainWindow(dbPath, dbName);
}

/**
 * Closes welcome window.
 */
function closeWelcomeWindow() {
    const query     = {target: 'welcomeWindow'};
    const windowKey = querystring.stringify(query);

    if (appWindows.has(windowKey)) {
        appWindows.get(windowKey).close();
    }
}

/**
 * Opens welcome window.
 */
export function openWelcomeWindow() {
    openWindow('welcomeWindow', {
        width          : 800,
        height         : process.platform === 'darwin' ? 520 : 540,
        title          : 'Tentacles Manager',
        show           : false,
        resizable      : false,
        maximizable    : false,
        webPreferences : {
            nodeIntegration: true
        },
    });
}

/**
 * Downloads data from the given url address.
 *
 * @param {string} url URL address to download file from.
 * @returns {Promise<Buffer>}
 */
export function downloadFile (url) {
    return fetch(url).then(res => {
        return res.buffer();
    })
}

app.on('ready', () => {
    if (process.env.NODE_ENV !== 'development') {
        Menu.setApplicationMenu(applicationMenu());
    }

    openWelcomeWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});