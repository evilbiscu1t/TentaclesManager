<template>
    <v-card>
        <v-text-field class="mx-4" :label="$t('settings.addCategory')" v-model="categoryToAdd" append-icon="add_circle_outline" @keyup.enter.native="addCategory" @keydown="clearErrors" @click:append="addCategory" :error="inputError" :error-messages="errorMessages"></v-text-field>
        <v-list>
            <v-list-tile v-for="category in categories" :key="category._id">
                <v-list-tile-action>
                    <v-icon :color="category.color">category</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>{{ category.name }}</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-action>
                    <v-btn icon ripple @click="showEditDialog(category)">
                        <v-icon color="grey lighten-1">edit</v-icon>
                    </v-btn>
                </v-list-tile-action>
            </v-list-tile>
        </v-list>

        <v-dialog v-model="editDialogVisible" persistent width="355">
            <v-card>
                <v-card-title>
                    <span class="headline">{{ $t('category.edit') }}</span>
                </v-card-title>
                <v-card-text>
                    <v-text-field :label="$t('category.name')" v-model="editedData.name" :error="editInputError" :error-messages="editErrorMessages" @keydown="clearEditErrors"></v-text-field>
                    <span class="grey--text text--darken-2">{{ $t('category.color') }}</span>
                    <Swatches v-model="editedData.color" />
                </v-card-text>
                <v-card-actions>
                    <v-btn color="red" flat @click="deleteCategory">Delete</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" flat @click="closeEditDialog">Close</v-btn>
                    <v-btn color="primary" flat @click="saveCategory">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
    import { Swatches } from 'vue-color';
    import { mapGetters } from 'vuex';

    import { lightOrDark } from '../../lib/ColorUtils.js';

    export default {
        name: 'CategorySettings',

        data () {
            return {
                /**
                 * Name of the category to add to the list.
                 */
                categoryToAdd : '',

                /**
                 * Is error on input when adding new category.
                 */
                inputError : false,

                /**
                 * Error messages for input when adding new category.
                 */
                errorMessages : [],

                /**
                 * Is edit input in error state.
                 */
                editInputError : false,

                /**
                 * Error messages for edit input.
                 */
                editErrorMessages : [],

                /**
                 * If edit dialog should be visible.
                 */
                editDialogVisible : false,

                /**
                 * Edited data.
                 */
                editedData : {
                    id    : 0,
                    name  : '',
                    color : '#607D8B',
                },
            };
        },

        computed : mapGetters(['categories']),

        methods : {
            /**
             * Add new category to the list.
             */
            addCategory () {
                if (!this.categoryToAdd.trim()) {
                    this.inputError = true;
                    this.errorMessages.push(this.$t('validation.insertValue'));
                    return;
                }

                const category = {
                    name  : this.categoryToAdd,
                    color : '#607D8B',
                    dark  : true,
                };

                this.$emit('loading-status-changed', true);
                this.$store.dispatch('addCategory', category).then(() => {
                    this.$emit('loading-status-changed', false);
                    this.categoryToAdd = '';
                }, (e) => {
                    this.$emit('loading-status-changed', false);
                    this.inputError = true;
                    this.errorMessages.push('' + e);
                });
            },

            clearErrors () {
                this.inputError = false;
                this.errorMessages = [];
            },

            clearEditErrors () {
                this.editInputError = false;
                this.editErrorMessages = [];
            },

            /**
             * Saves data from edit dialog updating category.
             */
            saveCategory () {
                if (!this.editedData.name.trim()) {
                    this.editInputError = true;
                    this.editErrorMessages.push(this.$t('validation.insertValue'));
                    return;
                }

                this.$emit('loading-status-changed', true);

                const color = (typeof this.editedData.color == 'string') ? this.editedData.color : this.editedData.color.hex;

                this.$store.dispatch('updateCategory', {
                    _id   : this.editedData.id,
                    name  : this.editedData.name,
                    color : color,
                    dark  : lightOrDark(color) === 'dark',
                }).then(() => {
                    this.$emit('loading-status-changed', false);

                    this.closeEditDialog();

                    this.$emit('category-updated');
                });
            },

            /**
             * Deletes currently edited category.
             */
            deleteCategory () {
                this.$emit('loading-status-changed', true);

                this.$store.dispatch('deleteCategory', this.editedData.id).then(() => {
                    this.$emit('loading-status-changed', false);

                    this.closeEditDialog();

                    this.$emit('category-updated');
                });
            },

            /**
             * Closes edit dialog and clears its form data.
             */
            closeEditDialog () {
                this.editDialogVisible = false;

                this.editedData.name  = '';
                this.editedData.id    = 0;
                this.editedData.color = '#607D8B';
            },

            /**
             * Opens edit dialog for selected category.
             *
             * @param {Object} category Category to edit.
             */
            showEditDialog (category) {
                this.editedData.name  = category.name;
                this.editedData.id    = category._id;
                this.editedData.color = category.color;

                this.editDialogVisible = true;
            },
        },

        components : {
            Swatches,
        }
    };
</script>

<style scoped>

</style>