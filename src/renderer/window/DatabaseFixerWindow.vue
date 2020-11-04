<template>
    <v-app>
        <v-content class="white">
            <div style="text-align: center;" class="py-2">
                <v-icon size="130" color="deep-purple">handyman</v-icon>
            </div>
            <v-container grid-list-xl>
                <v-tooltip bottom>
                    <v-text-field :label="$t('password')" type="password" v-model="password" :readonly="loading" :error="error" :error-messages="errorMsg" slot="activator" required></v-text-field>
                    <span>{{ $t('tooltip.fixDb.password') }}</span>
                </v-tooltip>
                <div style="text-align: justify">{{ $t('fixDb.info') }}</div>

                <div style="text-align: center" class="pt-5" v-show="loading">
                    <v-progress-circular
                        :size="70"
                        :width="7"
                        color="purple"
                        indeterminate
                    ></v-progress-circular>
                </div>

                <div style="text-align: center" class="pt-5" v-show="!loading && totalLines">
                    <v-icon size="70" color="green" class="pb-2">check_circle</v-icon>
                    <div style="text-align: justify">{{ $t('fixDb.result', {total: totalLines, removed: removedLines}) }}</div>
                </div>
            </v-container>
        </v-content>
        <v-footer class="py-4 white" app>
            <v-spacer></v-spacer>
            <v-btn @click="closeWindow" flat v-show="totalLines">{{ $t('close') }}</v-btn>
            <v-btn @click="closeWindow" flat v-show="!totalLines" :disabled="loading">{{ $t('cancel') }}</v-btn>
            <v-btn @click="fixDatabase" flat dark color="deep-purple" v-show="!totalLines" :disabled="loading">{{ $t('start') }}</v-btn>
        </v-footer>
    </v-app>
</template>

<script>
import {remote} from "electron";
import {mapGetters} from "vuex";
import UnlockDatabaseOperation from "../operations/UnlockDatabase";
import FixDatabase from "../operations/FixDatabase";

const mainProcess = remote.require('./main.js');

export default {
    name: "DatabaseFixerWindow",

    computed: {...mapGetters(['dbFile'])},

    data () {
        return {
            /**
             * Password to unlock database.
             */
            password : '',
            error : false,
            errorMsg : [],
            loading : false,

            totalLines : 0,
            removedLines : 0,
        };
    },

    methods : {
        closeWindow () {
            remote.getCurrentWindow().close();
        },

        fixDatabase () {
            this.error = false;
            this.errorMsg = [];

            if (this.password.length < 6) {
                this.error = true;
                this.errorMsg.push(this.$t('validation.minLength', {minLength: 6}));
                return;
            }

            this.loading = true;
            mainProcess.createBackup(this.dbFile).then(() => {
                const dbUnlock = new UnlockDatabaseOperation(this.dbFile, this.password);

                dbUnlock.unlockAndLoadData().then(() => {
                    const fixDatabase = new FixDatabase(this.dbFile, this.password);

                    fixDatabase.fixDatabase().then((result) => {
                        this.loading = false;
                        this.totalLines = result.total;
                        this.removedLines = result.removed;
                    });
                }, err => {
                    this.loading = false;

                    if (err.message.indexOf('BAD_DECRYPT') > -1) {
                        this.error = true;
                        this.errorMsg.push(this.$t('dialog.unlockPassError'));
                    } else {
                        this.error = true;
                        this.errorMsg.push(err.message);
                    }
                });
            });
        }
    }
}
</script>

<style scoped>

</style>