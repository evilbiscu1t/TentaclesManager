<template>
    <v-card>
        <v-card-text>
            <h5 class="headline">{{$t('settings.propertiesVisibility')}}</h5>
            <v-select :label="$t('item.patreonLink')" :items="fieldVisibilityOptions" v-model="patreonLinkVisibility"></v-select>
            <v-select :label="$t('item.www')" :items="fieldVisibilityOptions" v-model="wwwLinkVisibility"></v-select>
            <v-select :label="$t('item.f95link')" :items="fieldVisibilityOptions" v-model="f95LinkVisibility"></v-select>
            <v-select :label="$t('item.itchLink')" :items="fieldVisibilityOptions" v-model="itchLinkVisibility"></v-select>
        </v-card-text>
    </v-card>
</template>

<script>
    export default {
        name: "AdditionalDataSettings",

        data () {
            return {
                fieldVisibilityOptions : [],
            };
        },

        computed : {
            patreonLinkVisibility : {
                get () {
                    return this.$store.getters.settings.patreonLinkVisibility;
                },
                set (value) {
                    this.$store.dispatch('updatePatreonLinkVisibility', value);
                }
            },
            wwwLinkVisibility : {
                get () {
                    return this.$store.getters.settings.wwwLinkVisibility;
                },
                set (value) {
                    this.$store.dispatch('updateWwwLinkVisibility', value);
                }
            },
            f95LinkVisibility : {
                get () {
                    return this.$store.getters.settings.f95LinkVisibility;
                },
                set (value) {
                    this.$store.dispatch('updateF95LinkVisibility', value);
                }
            },
            itchLinkVisibility : {
                get () {
                    return this.$store.getters.settings.itchLinkVisibility;
                },
                set (value) {
                    this.$store.dispatch('updateItchLinkVisibility', value);
                }
            },
        },

        created () {
            this.fieldVisibilityOptions = [
                {value: 'show', text: this.$t('settings.fieldVisibilityOption.show')},
                {value: 'panel', text: this.$t('settings.fieldVisibilityOption.showInPanel')},
                {value: 'hide', text: this.$t('settings.fieldVisibilityOption.hide')},
            ];
        },
    }
</script>

<style scoped>

</style>