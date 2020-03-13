<template>
    <v-dialog v-model="isVisible" persistent max-width="600">
        <v-card>
            <v-card-title>
                <span class="headline">{{ title }}</span>
            </v-card-title>
            <v-card-text>
                <v-image-input
                        v-model="imageData"
                        :image-quality="settings.imageQuality"
                        clearable
                        image-format="jpeg"
                        :image-width="100"
                        :image-height="100"
                        full-width
                />
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat color="primary" @click="hide"><v-icon class="mr-1">close</v-icon> {{ $t('cancel') }}</v-btn>
                <v-btn flat color="primary" @click="save"><v-icon class="mr-1">save</v-icon> {{ $t('save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'ImageEditDialog',

        data () {
            return {
                isVisible : false,
                imageData : '',
                title     : '',
            };
        },

        computed : mapGetters(['settings']),

        methods : {
            show (title, imageData = '') {
                this.title     = title;
                this.imageData = imageData;
                this.isVisible = true;
            },

            save () {
                this.$emit('image-saved', this.imageData);
                this.isVisible = false;
                this.imageData = '';
            },

            hide () {
                this.isVisible = false;
                this.imageData = '';
            }
        }
    };
</script>

<style scoped>

</style>