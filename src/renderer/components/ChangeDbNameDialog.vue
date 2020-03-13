<template>
    <v-dialog v-model="isVisible" persistent max-width="450">
        <v-card>
            <v-card-title>
                <span class="headline">{{ $t('changeDatabaseName') }}</span>
            </v-card-title>
            <v-card-text>
                <v-text-field :label="$t('newName')" class="mx-2" v-model="newDbName" :error="isError" :error-messages="errorMessages"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>

                <v-btn flat @click="hide">{{ $t('cancel') }}</v-btn>
                <v-btn color="primary" flat @click="save">{{ $t('save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import fs from 'fs';
    import path from 'path';

    export default {
        name: 'ChangeDbNameDialog',

        data () {
            return {
                isVisible : false,

                newDbName : '',

                oldDbName : '',

                dbPath : '',

                isError : false,

                errorMessages: []
            };
        },

        methods : {
            show (dbData) {
                this.newDbName = dbData.name;
                this.oldDbName = dbData.name;
                this.dbPath    = dbData.path;

                this.isVisible = true;
            },

            hide () {
                this.isVisible = false;

                this.newDbName = '';
                this.oldDbName = '';
                this.dbPath    = '';

                this.isError = false;
                this.errorMessages = [];
            },

            save () {
                this.isError = false;
                this.errorMessages = [];

                this.newDbName = this.newDbName.trim();

                const nameIsValid = this._validateFilename(this.newDbName);

                if (nameIsValid !== true) {
                    this.isError = true;
                    this.errorMessages.push(nameIsValid);
                    return;
                }

                const newPath = path.join(this.dbPath, this.newDbName);
                if (fs.existsSync(newPath)) {
                    this.isError = true;
                    this.errorMessages.push(this.$t('validation.nameExists'));
                    return;
                }

                fs.renameSync(path.join(this.dbPath, this.oldDbName), newPath);

                this.$emit('rename-complete', {path: this.dbPath, name: this.oldDbName}, {path: this.dbPath, name: this.newDbName});

                this.hide();
            },

            _validateFilename (name) {
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
</script>

<style scoped>

</style>