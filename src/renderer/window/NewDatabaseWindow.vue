<template>
    <v-app>
        <v-content class="white">
            <div style="text-align: center;" class="py-2">
                <v-icon size="130" color="deep-purple">lock</v-icon>
            </div>
            <v-container grid-list-xl>
                <v-form ref="form" lazy-validation>
                    <v-tooltip bottom>
                        <v-text-field append-icon="folder" @click:append="showChooseDirectory" :label="$t('directory')" v-model="values.directory" :rules="[validationRules.directoryExists]" slot="activator" ref="directoryField" required></v-text-field>
                        <span>{{ $t('tooltip.directory') }}</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <v-text-field :counter="30" :label="$t('name')" v-model="values.name" :rules="[validationRules.filename]" slot="activator" ref="nameField" required></v-text-field>
                        <span>{{ $t('tooltip.name') }}</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <v-text-field :label="$t('password')" type="password" v-model="values.password" :rules="[validationRules.passwordIsValid]" slot="activator" required></v-text-field>
                        <span>{{ $t('tooltip.password') }}</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <v-text-field :label="$t('repeatPassword')" type="password" v-model="values.repeatPassword" :rules="[validationRules.repeatPasswordIsValid]" slot="activator" required></v-text-field>
                        <span>{{ $t('tooltip.repeatPassword') }}</span>
                    </v-tooltip>
                    <v-expansion-panel v-model="otherSettingsExpanded" class="my-3">
                        <v-expansion-panel-content>
                            <div slot="header">{{ $t('otherSettings') }}</div>
                            <v-card>
                                <v-card-text>
                                    <v-select :label="$t('settings.linkClickAction')" :items="linkOptions" v-model="values.linkClickAction"></v-select>
                                    <v-select :label="$t('settings.patreonClickAction')" :items="linkOptions" v-model="values.patreonClickAction"></v-select>
                                    <v-select :label="$t('settings.f95ClickAction')" :items="linkOptions" v-model="values.f95ClickAction"></v-select>
                                    <v-tooltip top>
                                        <template #activator="{on}">
                                            <v-subheader class="pl-0" v-on="on">{{ $t('imagesQuality') }}</v-subheader>
                                            <v-slider v-model="values.imageQuality" thumb-label :min="50" ref="lastSwitch"></v-slider>
                                        </template>
                                        <span>{{ $t('tooltip.imagesQuality') }}</span>
                                    </v-tooltip>
                                </v-card-text>
                            </v-card>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-form>
            </v-container>
        </v-content>
        <v-footer class="py-4 white" app>
            <v-spacer></v-spacer>
            <v-btn @click="closeWindow" flat>{{ $t('cancel') }}</v-btn>
            <v-btn @click="createDatabase" flat dark color="deep-purple">{{ $t('create') }}</v-btn>
        </v-footer>
        <v-dialog v-model="showLoading" persistent width="300">
            <v-card color="primary" dark>
                <v-card-text>
                    {{ $t('savingData') }}
                    <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog v-model="showError" width="500">
            <v-card>
                <v-card-title class="headline grey lighten-2" primary-title>
                    {{ $t('error') }}
                </v-card-title>
                <v-card-text>{{ errorText }}</v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" flat @click="closeErrorDialog">
                        {{ $t('close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
    import {remote} from 'electron';
    import fs from 'fs';

    import CreateNewDbOperation from '../operations/CreateNewDatabase.js';

    const mainProcess = remote.require('./main.js');

    export default {
        name: 'NewDatabaseWindow',

        data () {
            return {
                otherSettingsExpanded : null,

                showLoading : false,

                showError  : false,
                errorText  : '',
                errorField : null,

                values : {
                    name           : '',
                    directory      : '',
                    password       : '',
                    repeatPassword : '',

                    imageQuality : 85,
                    linkClickAction : 'open',
                    patreonClickAction : 'open',
                    f95ClickAction : 'open',
                },

                linkOptions : [],

                validationRules : {
                    /**
                     * Checks if password is valid (currently only length check).
                     *
                     * @param {string} pass Password to validate.
                     * @returns {boolean|string} TRUE if ok, error message if not ok.
                     */
                    passwordIsValid : pass => {
                        if (!pass || pass.length < 6) {
                            return this.$t('validation.minLength', {minLength: 6});
                        }

                        return true;
                    },

                    /**
                     * Checks if repeat password field has the same value as original password field.
                     *
                     * @param {string} pass Repeated password value.
                     * @returns {string|boolean} TRUE if ok, error message if not ok.
                     */
                    repeatPasswordIsValid : pass => {
                        if (pass !== this.values.password) {
                            return this.$t('validation.repeatPasswordMismatch');
                        }

                        return true;
                    },

                    /**
                     * Tests if directory exists.
                     *
                     * @param {string} directory Directory with full patch to check.
                     * @returns {boolean|string} TRUE if ok, error message if not ok.
                     */
                    directoryExists : directory => {
                        if (!directory || directory.length < 3) {
                            return this.$t('validation.minLength', {minLength: 3});
                        }

                        if (!fs.existsSync(directory)) {
                            return this.$t('validation.chooseExistingDirectory');
                        }
                        return true;
                    },

                    /**
                     * Checks if given name is correct filename.
                     *
                     * @param {string} name Name to check.
                     * @returns {boolean|string} TRUE if ok, error message if not ok.
                     */
                    filename : name => {
                        name = name.trim();

                        if (!name || name.length < 3) {
                            return this.$t('validation.minLength', {minLength: 3});
                        }

                        const rg1=/^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
                        const rg2=/^\./; // cannot start with dot (.)
                        const rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names

                        if (rg1.test(name) && !rg2.test(name) && !rg3.test(name)) {
                            return true;
                        } else {
                            return this.$t('validation.incorrectFilename');
                        }
                    }
                }
            };
        },

        methods : {
            closeWindow () {
                remote.getCurrentWindow().close();
            },

            closeErrorDialog () {
                this.showError = false;
                if (this.errorField) {
                    setTimeout(() => {
                        this.errorField.focus();
                        this.errorField = null;
                    }, 500);
                }
            },

            showChooseDirectory () {
                const directory = mainProcess.chooseDirectory(remote.getCurrentWindow());

                directory.then(result => {
                    if (!result.canceled && result.filePaths.length) {
                        this.values.directory = result.filePaths[0];
                    }
                });
            },

            createDatabase () {
                if (this.$refs.form.validate()) {
                    this.showLoading = true;

                    const createDb = new CreateNewDbOperation(
                        this.values.directory,
                        this.values.name,
                        this.values.password,
                        {
                            imageQuality : this.values.imageQuality,
                            linkClickAction : this.values.linkClickAction,
                            patreonClickAction : this.values.patreonClickAction,
                            f95ClickAction : this.values.f95ClickAction,
                        }
                    );

                    createDb.create().then(result => {
                        this.showLoading = false;

                        if (result === 'ok') {
                            mainProcess.newDatabaseCreated(remote.getCurrentWindow(), this.values.name, this.values.directory);
                        } else {
                            switch (result) {
                                case 'path_not_exists':
                                    this.errorText  = this.$t('validation.chooseExistingDirectory');
                                    this.showError  = true;
                                    this.errorField = this.$refs.directoryField;
                                    break;
                                case 'path_not_directory':
                                    this.errorText  = this.$t('validation.pathIsNotDirectory');
                                    this.showError  = true;
                                    this.errorField = this.$refs.directoryField;
                                    break;
                                case 'path_not_writable':
                                    this.errorText  = this.$t('validation.pathNotWritable');
                                    this.showError  = true;
                                    this.errorField = this.$refs.directoryField;
                                    break;
                                case 'name_already_exists':
                                    this.errorText  = this.$t('validation.nameExists');
                                    this.showError  = true;
                                    this.errorField = this.$refs.nameField;
                                    break;
                                default:
                                    this.errorText = this.$t('validation.unknownError');
                                    this.showError = true;
                                    break;
                            }
                        }
                    });
                }
            },
        },

        created () {
            this.linkOptions = [
                {value: 'open', text: this.$t('settings.linkClickAction.open')},
                {value: 'copy', text: this.$t('settings.linkClickAction.copy')},
                {value: 'ask', text: this.$t('settings.linkClickAction.ask')}
            ];
        },

        watch : {
            otherSettingsExpanded : {
                handler : function (val) {
                    if (val !== null) {
                        setTimeout(() => {
                            this.$vuetify.goTo(this.$refs.lastSwitch);
                        }, 300);
                    }
                }
            }
        }
    };
</script>

<style scoped>

</style>