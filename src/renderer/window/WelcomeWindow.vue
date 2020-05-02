<template>
    <v-app>
        <v-content>
            <v-container fluid fill-height>
                <v-layout row fill-height>
                    <v-flex xs6>
                        <div class="text-xs-center">
                            <img :src="logoImageUrl" width="50%"  alt="logo" />
                            <h4 class="display-1">Tentacles Manager</h4>
                            <p class="subheading">{{ $t('version', {vNumber: '1.1'}) }}</p>
                            <p class="caption">By <a href="https://github.com/evilbiscu1t/TentaclesManager" title="Github page" @click="openWebLink">EvilBiscuit</a></p>
                            <div class="pt-5">
                                <v-btn dark class="deep-purple" @click="createDatabase">
                                    <v-icon left dark>note_add</v-icon>
                                    {{ $t('createNewDatabase') }}
                                </v-btn>
                            </div>
                            <div class="caption pa-2 grey--text">
                                Application icon made by
                                <a href="https://www.freepik.com/" title="Freepik" @click="openWebLink">Freepik</a> from
                                <a href="https://www.flaticon.com/" title="Flaticon" @click="openWebLink">www.flaticon.com</a> is licensed by
                                <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank" @click="openWebLink">CC 3.0 BY</a>
                            </div>
                        </div>
                    </v-flex>
                    <v-flex xs6>
                        <v-toolbar dark color="deep-purple">
                            <v-toolbar-title>{{ $t('databaseDocuments') }}</v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-tooltip bottom>
                                <v-btn icon slot="activator" @click="openExistingDatabase">
                                    <v-icon>folder</v-icon>
                                </v-btn>
                                <span>{{ $t('openExistingDb') }}</span>
                            </v-tooltip>
                        </v-toolbar>
                        <v-card :height="windowHeight - 135" style="overflow-y: auto;">
                            <v-list two-line>
                                <template v-for="db in recentlyOpened">
                                    <v-list-tile :key="`${db.path}-${db.name}`" @click="openDatabase(db)" @contextmenu="showDatabaseContextMenu($event, db)">
                                        <v-list-tile-content>
                                            <v-list-tile-title>{{ db.name }}</v-list-tile-title>
                                            <v-list-tile-sub-title>{{ db.path }}</v-list-tile-sub-title>
                                        </v-list-tile-content>
                                    </v-list-tile>
                                    <v-divider :key="`divider-${db.path}-${db.name}`"></v-divider>
                                </template>
                            </v-list>
                        </v-card>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <ChangeDbNameDialog ref="renameDialog" @rename-complete="renameComplete" />
        <ChangePasswordDialog ref="changePasswordDialog" @db-password-changed="showPasswordChangedMessage" />

        <v-dialog v-model="infoDialogOpened" max-width="300px">
            <v-card>
                <v-card-text>{{ infoMessage }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" flat @click="infoDialogOpened = false">{{ $t('close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
    import {shell, remote, ipcRenderer} from 'electron';
    import fs from 'fs';
    import path from 'path';

    import {getStatic} from '../static.js';
    import ChangeDbNameDialog from '../components/ChangeDbNameDialog.vue';
    import ChangePasswordDialog from '../components/ChangePasswordDialog.vue';

    const mainProcess = remote.require('./main.js');

    export default {
        name: 'WelcomeWindow',
        components: {ChangePasswordDialog, ChangeDbNameDialog},
        data () {
            return {
                /**
                 * List of recently opened databases.
                 */
                recentlyOpened : [],

                /**
                 * Is info dialog opened.
                 */
                infoDialogOpened : false,

                /**
                 * Message to display in the info dialog.
                 */
                infoMessage : '',
            };
        },

        computed : {
            logoImageUrl () {
                return getStatic('icon.png');
            },

            windowHeight () {
                let height = remote.getCurrentWindow().getBounds().height;
                if (process.platform === 'darwin') {
                    height += 20;
                }

                return height;
            }
        },

        methods : {
            createDatabase () {
                mainProcess.openWindow('newDatabaseWindow', {
                    width          : 400,
                    height         : 650,
                    show           : false,
                    resizable      : false,
                    maximizable    : false,
                    title          : this.$t('createNewDatabase'),
                    parent         : remote.getCurrentWindow(),
                    modal          : true,
                    webPreferences : {
                        nodeIntegration: true
                    },
                }, {}, false);
            },

            openDatabase (dbData) {
                const result = mainProcess.openMainWindow(dbData.path, dbData.name);

                if (result === 'db_not_exists') {
                    this.infoMessage = this.$t('error.dbNotExists');
                    this.infoDialogOpened = true;
                }
            },

            deleteDatabase (dbData) {
                const index = this.recentlyOpened.indexOf(dbData);
                if (index > -1) {
                    this.recentlyOpened.splice(index, 1);

                    localStorage.setItem('recentlyOpened', JSON.stringify(this.recentlyOpened));
                }
            },

            renameDatabase (dbData) {
                if (!fs.existsSync(dbData.path)) {
                    this.infoMessage      = this.$t('error.dbNotExists');
                    this.infoDialogOpened = true;
                } else {
                    if (!fs.existsSync(path.join(dbData.path, dbData.name))) {
                        this.infoMessage      = this.$t('error.dbNotExists');
                        this.infoDialogOpened = true;
                    } else {
                        mainProcess.closeMainWindow(dbData.path, dbData.name);

                        this.$refs.renameDialog.show(dbData);
                    }
                }
            },

            renameComplete (oldDbData, newDbData) {
                const dbData = this.recentlyOpened.find(db => db.name === oldDbData.name && db.path === oldDbData.path);

                if (dbData) {
                    dbData.name = newDbData.name;
                }

                localStorage.setItem('recentlyOpened', JSON.stringify(this.recentlyOpened));
            },

            changePassword (dbData) {
                if (!fs.existsSync(dbData.path)) {
                    this.infoMessage      = this.$t('error.dbNotExists');
                    this.infoDialogOpened = true;
                } else {
                    if (!fs.existsSync(path.join(dbData.path, dbData.name))) {
                        this.infoMessage      = this.$t('error.dbNotExists');
                        this.infoDialogOpened = true;
                    } else {
                        mainProcess.closeMainWindow(dbData.path, dbData.name);
                        this.$refs.changePasswordDialog.show(dbData.name, dbData.path);
                    }
                }
            },

            showPasswordChangedMessage () {
                this.infoMessage = this.$t('passwordWasChanged');
                this.infoDialogOpened = true;
            },

            openWebLink (event) {
                event.preventDefault();
                shell.openExternal(event.target.href);
            },

            showDatabaseContextMenu (event, dbData) {
                event.preventDefault();

                remote.Menu.buildFromTemplate([
                    {
                        label: this.$t('changePassword'),
                        click: () => this.changePassword(dbData)
                    },
                    {
                        label: this.$t('rename'),
                        click: () => this.renameDatabase(dbData)
                    },
                    {
                        label: this.$t('delete'),
                        click: () => this.deleteDatabase(dbData)
                    }
                ]).popup();
            },

            openExistingDatabase () {
                mainProcess.chooseDirectory(remote.getCurrentWindow()).then(result => {
                    if (!result.canceled && result.filePaths.length) {
                        const dbFile = result.filePaths[0];
                        const dbName = path.basename(dbFile);
                        const dbPath = path.dirname(dbFile);

                        const dbData = this.recentlyOpened.find(db => db.name === dbName && db.path === dbPath);
                        if (dbData) {
                            this.openDatabase(dbData);
                        } else {
                            if (fs.existsSync(path.join(dbFile, 'settings.json'))) {
                                this.recentlyOpened.push({name: dbName, path: dbPath});
                                localStorage.setItem('recentlyOpened', JSON.stringify(this.recentlyOpened));

                                this.openDatabase({name: dbName, path: dbPath});
                            } else {
                                this.infoMessage = this.$t('error.incorrectDatabaseFormat');
                                this.infoDialogOpened = true;
                            }
                        }
                    }
                });
            },
        },

        created () {
            ipcRenderer.on('new-db-created', (event, data) => {
                this.recentlyOpened.push({name: data.dbName, path: data.dbPath});

                localStorage.setItem('recentlyOpened', JSON.stringify(this.recentlyOpened));
            });

            let recentlyOpened = localStorage.getItem('recentlyOpened');
            if (recentlyOpened) {
                recentlyOpened = JSON.parse(recentlyOpened);

                if (recentlyOpened) {
                    this.recentlyOpened = recentlyOpened;
                }
            }
        },
    };
</script>

<style scoped>
</style>