<template>
    <v-card>
        <v-card-text>
            <v-form class="pa-3" ref="form" @submit.prevent>
                <v-text-field :label="$t('urlAddress')" v-model="url" :rules="[validationRules.url]" @keyup.enter.native="downloadFromUrl"></v-text-field>
            </v-form>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="primary" @click="downloadFromUrl" flat><v-icon dark class="mr-2">cloud_download</v-icon> {{ $t('download') }}</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
    export default {
        name: 'DownloadFromUrlPopup',

        data () {
            return {
                url : '',

                validationRules : {
                    /**
                     * Tests if the given url address is correct.
                     *
                     * @param {string} value Value to test
                     * @returns {boolean} TRUE if value is correct. Error message otherwise.
                     */
                    url: value => {
                        const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

                        if (!urlRegex.test(value)) {
                            return this.$t('validation.incorrectUrl');
                        } else {
                            return true;
                        }
                    }
                }
            }
        },

        methods : {
            clearData () {
                this.url = '';
                this.$refs.form.resetValidation();
            },

            downloadFromUrl () {
                if (this.$refs.form.validate()) {
                    this.$emit('download-clicked', this.url);
                }
            }
        }
    };
</script>

<style scoped>

</style>