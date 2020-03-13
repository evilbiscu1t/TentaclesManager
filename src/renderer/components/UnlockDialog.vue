<template>
    <v-dialog persistent width="500" v-model="show">
        <v-card>
            <v-card-text>
                <v-text-field :label="$t('dialog.enterPassword')" type="password" v-model="password" @keyup.enter.native="unlock" :readonly="loading" :error="error" :error-messages="errorMsg" @keyup="clearErrors" required></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn :loading="loading" :disabled="loading" color="primary" @click="unlock">
                    <v-icon left dark>lock_open</v-icon>
                    {{ $t('dialog.unlockBtn') }}
                    <template slot="loader">
                        <span class="loader-icon">
                          <v-icon light>cached</v-icon>
                        </span>
                    </template>
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import UnlockDatabaseOperation from '../operations/UnlockDatabase.js';

    export default {
        name: 'UnlockDialog',

        data () {
            return {
                password : '',
                error : false,
                errorMsg : [],
                loading : false,
            };
        },

        props : {
            show : Boolean,
        },

        methods : {
            unlock () {
                if (this.password.length < 6) {
                    this.error = true;
                    this.errorMsg.push(this.$t('validation.minLength', {minLength: 6}));
                    return;
                }

                this.loading = true;

                const dbUnlock = new UnlockDatabaseOperation(this.$store.getters.dbFile, this.password);

                dbUnlock.unlockAndLoadData().then(() => {
                    this.loading = false;

                    this.$store.dispatch('setDbPassword', this.password);

                    this.$emit('database-unlocked');
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
            },

            clearErrors () {
                if (this.error) {
                    this.error = false;
                    this.errorMsg = [];
                }
            }
        }
    };
</script>

<style scoped>
    .loader-icon {
        animation: loader 1s infinite;
        display: flex;
    }

    @-moz-keyframes loader {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
    @-webkit-keyframes loader {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
    @-o-keyframes loader {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
    @keyframes loader {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>