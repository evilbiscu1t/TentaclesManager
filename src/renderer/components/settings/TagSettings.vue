<template>
    <v-card>
        <v-list>
            <v-list-tile v-for="tag in tags" :key="tag">
                <v-list-tile-content>
                    <v-list-tile-title>{{ tag }}</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-action>
                    <v-btn icon ripple @click="deleteTag(tag)">
                        <v-icon color="grey lighten-1">delete</v-icon>
                    </v-btn>
                </v-list-tile-action>
            </v-list-tile>
        </v-list>
    </v-card>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'TagSettings',

        computed : mapGetters(['tags']),

        methods : {
            deleteTag (tag) {
                this.$emit('loading-status-changed', true);

                this.$store.dispatch('deleteTag', tag).then(() => {
                    this.$emit('loading-status-changed', false);

                    this.$emit('tag-updated');
                });
            }
        }
    };
</script>

<style scoped>

</style>