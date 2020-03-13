<template>
    <v-navigation-drawer app dark v-model="open" mobile-break-point="0">
        <v-list dense class="pt-0">
            <v-list-tile @click="$emit('show-all')" v-model="showAll" active-class="deep-purple--text text--lighten-2" ripple>
                <v-list-tile-action>
                    <v-icon>apps</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                    <v-list-tile-title>{{ $t('navigation.allItems') }}</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>

            <v-list-tile @click="$emit('show-favorites')" v-model="showFav" active-class="deep-purple--text text--lighten-2" ripple>
                <v-list-tile-action>
                    <v-icon>favorite</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                    <v-list-tile-title>{{ $t('navigation.favorites') }}</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>

            <v-list-tile @click="$emit('show-archive')" v-model="showArchive" active-class="deep-purple--text text--lighten-2" ripple>
                <v-list-tile-action>
                    <v-icon>archive</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                    <v-list-tile-title>{{ $t('navigation.archived') }}</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>

            <v-list-group prepend-icon="category" no-action active-class="deep-purple--text text--lighten-2" v-if="categories.length">
                <template #activator>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title>{{ $t('navigation.categories') }}</v-list-tile-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </template>

                <v-list-tile @click="$emit('show-category', category._id)" v-for="category in categories" :key="category._id" :class="filters.category === category._id ? 'deep-purple--text text--lighten-2' : ''" ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ category.name }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>

                <v-list-tile @click="$emit('show-category', '*uncategorized*')" :class="filters.category === '*uncategorized*' ? 'deep-purple--text text--lighten-2' : ''" ripple>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ $t('uncategorized') }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>

            <v-list-tile @click="$emit('show-settings')" active-class="deep-purple--text text--lighten-2" v-model="settingsShown" ripple>
                <v-list-tile-action>
                    <v-icon>settings</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                    <v-list-tile-title>{{ $t('navigation.settings') }}</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
    </v-navigation-drawer>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'Navigation',

        props : {
            /**
             * If navigation panel is shown.
             */
            open : Boolean,

            /**
             * If settings dialog is shown.
             */
            settingsShown : Boolean,

            /**
             * Filters.
             */
            filters : Object,
        },

        computed : mapGetters(['categories']),

        data () {
            return {
                showAll : true,

                showFav : false,

                showArchive : false,
            };
        },

        methods : {
        },

        watch : {
            filters : {
                handler : function (newValue) {
                    this.showAll     = !newValue.category && !newValue.favorites && !newValue.archived;
                    this.showFav     = !!newValue.favorites;
                    this.showArchive = newValue.archived;
                },
                deep : true
            }
        }
    };
</script>

<style scoped>

</style>