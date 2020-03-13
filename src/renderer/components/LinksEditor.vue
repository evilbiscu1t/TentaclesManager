<template>
    <v-card class="mx-3">
        <v-card-title primary-title>
            <v-text-field :label="$t('item.addLink')" v-model="linkToAdd" append-icon="add_circle_outline" @keyup.enter.native="addLink" @keydown="clearErrors" @click:append="addLink" :error="inputError" @contextmenu="showStandardTextMenu" :error-messages="errorMessages"></v-text-field>
            <v-list dense style="width: 100%">
                <template v-for="link in value">
                    <v-list-tile :key="link">
                        <v-list-tile-content>
                            <v-list-tile-title v-text="link"></v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-btn flat color="red" icon @click="deleteLink(link)">
                                <v-icon>delete_outline</v-icon>
                            </v-btn>
                        </v-list-tile-action>
                    </v-list-tile>
                    <v-divider :key="'divider-' + link"></v-divider>
                </template>
            </v-list>
        </v-card-title>
    </v-card>
</template>

<script>
    import {standardTextMenu} from '../../main/menu.js';

    export default {
        name: 'LinksEditor',

        props: ['value'],

        data () {
            return {
                linkToAdd : '',

                inputError : false,
                errorMessages : [],
            };
        },

        methods : {
            addLink () {
                const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

                if (urlRegex.test(this.linkToAdd)) {
                    if (this.value.indexOf(this.linkToAdd) === -1) {
                        this.value.push(this.linkToAdd);
                        this.$emit('input', this.value);
                    }
                    this.linkToAdd = '';
                } else {
                    this.inputError = true;
                    this.errorMessages.push(this.$t('validation.incorrectUrl'));
                }
            },

            deleteLink (link) {
                const index = this.value.indexOf(link);

                if (index !== -1) {
                    this.value.splice(index, 1);
                }
                this.$emit('input', this.value);
            },

            clearErrors () {
                this.inputError = false;
                this.errorMessages = [];
            },

            showStandardTextMenu () {
                standardTextMenu().popup();
            }
        }
    };
</script>

<style scoped>

</style>