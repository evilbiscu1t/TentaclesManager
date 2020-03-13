<template>
    <v-dialog persistent width="500" v-model="isVisible">
        <v-card>
            <v-card-title>
                <span class="headline">{{ $t('dialog.changeDatabasePassword', {name: dbName}) }}</span>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-text-field :label="$t('dialog.currentPassword')" type="password" v-model="values.currentPassword" :readonly="isLoading" :error="isPasswordError" :error-messages="passwordErrorMessages" required></v-text-field>
                    <v-text-field :label="$t('dialog.newPassword')" type="password" v-model="values.newPassword" :readonly="isLoading" :rules="[validationRules.passwordIsValid]" required></v-text-field>
                    <v-text-field :label="$t('dialog.newPasswordRepeat')" type="password" v-model="values.repeatNewPassword" :readonly="isLoading" :rules="[validationRules.repeatPasswordIsValid]" required></v-text-field>
                </v-form>
                <v-progress-linear v-model="progressValue" :active="isLoading" />
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>

                <v-btn @click="hide" :disabled="isLoading" flat>{{ $t('cancel') }}</v-btn>
                <v-btn color="primary" @click="save" :disabled="isLoading" flat>{{ $t('save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import path from 'path';

    import ChangePasswordOperation from '../operations/ChangePassword.js';

    export default {
        name: 'ChangePasswordDialog',

        data () {
            return {
                isVisible : false,

                dbName : '',

                dbPath : '',

                progressValue : 0,

                isLoading : false,

                isPasswordError : false,

                passwordErrorMessages : [],

                values : {
                    currentPassword : '',
                    newPassword : '',
                    repeatNewPassword : '',
                },

                validationRules : {
                    /**
                     * Checks if password is valid (currently only length check).
                     *
                     * @param {string} pass Password to validate.
                     * @returns {boolean|string} TRUE if ok, error message if not ok.
                     */
                    passwordIsValid: pass => {
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
                    repeatPasswordIsValid: pass => {
                        if (pass !== this.values.newPassword) {
                            return this.$t('validation.repeatPasswordMismatch');
                        }

                        return true;
                    },
                }
            };
        },

        methods : {
            show (dbName, dbPath) {
                this.dbName = dbName;
                this.dbPath = dbPath;
                this.isVisible = true;
            },

            hide () {
                this.isVisible = false;
                this.dbPath = '';
                this.dbName = '';
                this.values.currentPassword = '';
                this.values.newPassword = '';
                this.values.repeatNewPassword = '';
                this.progressValue = 0;
                this.isLoading = false;
                this.isPasswordError = false;
                this.passwordErrorMessages = [];
                this.$refs.form.resetValidation();
            },

            save () {
                this.isPasswordError = false;
                this.passwordErrorMessages = [];

                if (this.$refs.form.validate()) {
                    if (this.values.currentPassword.length < 6) {
                        this.isPasswordError = true;
                        this.passwordErrorMessages.push(this.$t('validation.minLength', {minLength: 6}));
                        return;
                    }

                    this.isLoading     = true;
                    this.progressValue = 0;

                    const changePassword = new ChangePasswordOperation(
                        path.join(this.dbPath, this.dbName),
                        this.values.currentPassword,
                        this.values.newPassword
                    );

                    changePassword.execute(progress => {
                        this.progressValue = progress;
                    }).then(() => {
                        this.isLoading = false;

                        this.hide();
                        this.$emit('db-password-changed');
                    }, err => {
                        this.isLoading = false;

                        if (err.message.indexOf('BAD_DECRYPT') > -1) {
                            this.isPasswordError = true;
                            this.passwordErrorMessages.push(this.$t('dialog.unlockPassError'));
                        } else {
                            this.isPasswordError = true;
                            this.passwordErrorMessages.push(err.message);
                        }
                    });

                    let handler = () => {
                        this.progressValue += 1;

                        if (this.progressValue < 100) {
                            setTimeout(handler, 1000);
                        }
                    };
                    setTimeout(handler, 1000);
                }
            }
        }
    };
</script>

<style scoped>

</style>