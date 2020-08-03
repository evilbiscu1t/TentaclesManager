<template>
    <v-card>
        <v-card-text>
            <v-select :label="$t('settings.linkClickAction')" :items="linkOptions" v-model="linkClickAction"></v-select>
            <v-select :label="$t('settings.patreonClickAction')" :items="linkOptions" v-model="patreonClickAction"></v-select>
            <v-select :label="$t('settings.f95ClickAction')" :items="linkOptions" v-model="f95ClickAction"></v-select>
            <v-select :label="$t('settings.subscribeStarClickAction')" :items="linkOptions" v-model="subscribeStarClickAction"></v-select>
            <v-tooltip top>
                <template #activator="{on}">
                    <v-subheader class="pl-0" v-on="on">{{ $t('imagesQuality') }}</v-subheader>
                    <v-slider v-model="imageQuality" thumb-label :min="50" ref="lastSwitch"></v-slider>
                </template>
                <span>{{ $t('tooltip.imagesQuality') }}</span>
            </v-tooltip>
        </v-card-text>
    </v-card>
</template>

<script>
    import _ from 'lodash';

    export default {
        name: 'GeneralSettings',

        computed : {
            imageQuality : {
                get () {
                    return this.$store.getters.settings.imageQuality;
                },
                set : _.debounce(function (value) {
                    this.$store.dispatch('updateImageQuality', value);
                }, 1000)
            },

            linkClickAction : {
                get () {
                    return this.$store.getters.settings.linkClickAction;
                },
                set (value) {
                    this.$store.dispatch('updateLinkClickAction', value);
                }
            },

            patreonClickAction : {
                get () {
                    return this.$store.getters.settings.patreonClickAction;
                },
                set (value) {
                    this.$store.dispatch('updatePatreonClickAction', value);
                }
            },

            f95ClickAction : {
                get () {
                    return this.$store.getters.settings.f95ClickAction;
                },
                set (value) {
                    this.$store.dispatch('updateF95ClickAction', value);
                }
            },

            subscribeStarClickAction : {
                get () {
                    return this.$store.getters.settings.subscribeStarClickAction;
                },
                set (value) {
                    this.$store.dispatch('updateSubscribeStarClickAction', value);
                }
            },
        },

        data () {
            return {
                linkOptions : [],
            };
        },

        created () {
            this.linkOptions = [
                {value: 'open', text: this.$t('settings.linkClickAction.open')},
                {value: 'copy', text: this.$t('settings.linkClickAction.copy')},
                {value: 'ask', text: this.$t('settings.linkClickAction.ask')}
            ];
        },
    };
</script>

<style scoped>

</style>