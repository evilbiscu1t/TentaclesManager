<template>
    <v-dialog v-model="isVisible" persistent max-width="600" scrollable>
        <v-card>
            <v-toolbar dark color="primary">
                <v-toolbar-title>{{ $t('settings') }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn icon dark @click="$emit('hide-dialog')">
                        <v-icon>close</v-icon>
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <v-tabs centered color="primary" slider-color="secondary" dark>
                <v-tab key="base-settings" ripple>{{ $t('settings') }}</v-tab>
                <v-tab key="tags-settings" ripple>{{ $t('item.tags') }}</v-tab>
                <v-tab key="categories-settings" ripple>{{ $t('navigation.categories') }}</v-tab>

                <v-tab-item key="base-settings">
                    <GeneralSettings />
                </v-tab-item>
                <v-tab-item key="tags-settings">
                    <TagSettings  @loading-status-changed="loadingStatusChanged" @tag-updated="$emit('tag-updated')" />
                </v-tab-item>
                <v-tab-item key="categories-settings">
                    <CategorySettings @loading-status-changed="loadingStatusChanged" @category-updated="$emit('category-updated')" />
                </v-tab-item>
            </v-tabs>
        </v-card>
    </v-dialog>
</template>

<script>
    import GeneralSettings from './GeneralSettings.vue';
    import TagSettings from './TagSettings.vue';
    import CategorySettings from './CategorySettings.vue';

    export default {
        name: 'SettingsDialog',

        props : {
            isVisible : Boolean
        },

        components : {
            GeneralSettings,
            TagSettings,
            CategorySettings,
        },

        methods : {
            loadingStatusChanged (isLoading) {
                this.$emit('loading-status-changed', isLoading);
            }
        }
    };
</script>

<style scoped>

</style>