<template>
    <v-app>
        <nav>
            <v-toolbar app>
                <v-toolbar-side-icon @click="showNavigation = !showNavigation"></v-toolbar-side-icon>
                <v-toolbar-title>{{ dbName }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <div v-if="showLastUpdate">{{ $t('lastUpdate', {date: lastVersionUpdateDate}) }}</div>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <v-btn flat icon color="primary" v-on="on" @click="showAddNewItemForm">
                            <v-icon>add_circle</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('item.addNew') }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <v-btn flat icon color="blue" v-on="on" @click="updateAllItemsVersion" v-show="filters.updated">
                            <v-icon>sync</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('item.updateVersionsInfo') }}</span>
                </v-tooltip>
                <v-menu :close-on-content-click="false" v-model="isFilterVisible"
                        :nudge-width="400"
                        offset-y>
                    <template #activator="{ on }">
                        <v-btn flat icon :color="filterBtnColor" v-on="on">
                            <v-icon>filter_list</v-icon>
                        </v-btn>
                    </template>

                    <FiltersPanel v-model="isFilterDefined" @filters-changed="filtersChanged" />
                </v-menu>

                <v-menu :close-on-content-click="false" v-model="isSortVisible"
                        :nudge-width="400"
                        offset-y>
                    <template #activator="{ on }">
                        <v-btn flat icon v-on="on">
                            <v-icon>sort_by_alpha</v-icon>
                        </v-btn>
                    </template>

                    <SortPanel v-model="sortOrder" />
                </v-menu>
            </v-toolbar>

            <Navigation :open="showNavigation" :filters="filters"
                        :settings-shown="showSettings"
                        @show-settings="showSettings = true"
                        @show-favorites="showFavorites"
                        @show-all="showAll"
                        @show-archive="showArchive"
                        @show-category="showCategory"
                        @show-updated="showUpdated"
            />
        </nav>

        <v-content>
            <ItemsTable ref="itemsTable" @edit-click="showEditDialog" @show-screenshots="showScreenshots" @delete-clicked="openDeleteDialog" @show-info="showInfoSnackbar" :items="items" :filters="filters" />
        </v-content>

        <footer>
            <v-footer app inset height="42">
                <span class="px-2">{{ $t('totalItems') }}: {{ totalItemsCount }}</span>
                <v-spacer></v-spacer>
                <v-pagination v-model="currentPage" :length="totalPages"></v-pagination>
            </v-footer>
        </footer>
        <UnlockDialog :show="showUnlockDialog" @database-unlocked="initData" />
        <ItemFormDialog ref="itemFormDialog" @form-saved="itemSaved" @loading-status-changed="setLoading" @show-error="showInfoDialog" />

        <v-dialog v-model="showLoading" persistent width="300">
            <v-card color="primary" dark>
                <v-card-text>
                    {{ $t('loadingData') }}
                    <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="infoDialogOpened" max-width="450px">
            <v-card>
                <v-card-text>{{ infoMessage }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" flat @click="infoDialogOpened = false">{{ $t('close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteDialogOpened" max-width="450px" persistent>
            <v-card>
                <v-card-title>
                    <span class="headline">{{ $t('dialog.deleteItemTitle') }}</span>
                </v-card-title>
                <v-card-text>{{ $t('dialog.deleteItemWarning', {name: itemToDelete.name}) }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="secondary" flat @click="closeDeleteDialog">{{ $t('close') }}</v-btn>
                    <v-btn color="error" flat @click="deleteItem"><v-icon class="mr-2">delete</v-icon> {{ $t('delete') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <SettingsDialog :is-visible="showSettings" @hide-dialog="showSettings = false" @loading-status-changed="setLoading" @category-updated="countItems" @tag-updated="countItems" />
        <ScreenshotsDialog ref="screenshotsDialog" />
        <DownloadVersionsDialog ref="downloadVersionsDialog" @update-complete="countItems" />

        <v-snackbar v-model="infoSnackbarOpened" :timeout="3000" bottom>
            {{ infoSnackbarMessage }}
        </v-snackbar>
    </v-app>
</template>

<script>
    import { remote } from 'electron';
    import { mapGetters } from 'vuex';
    import moment from 'moment';

    import Navigation from '../components/Navigation.vue';
    import UnlockDialog from '../components/UnlockDialog.vue';
    import ItemsTable from '../components/ItemsTable.vue';
    import ItemFormDialog from '../components/ItemFormDialog.vue';
    import SettingsDialog from '../components/settings/SettingsDialog.vue';
    import FiltersPanel from '../components/FiltersPanel.vue';
    import ScreenshotsDialog from '../components/ScreenshotsDialog.vue';
    import SortPanel from '../components/SortPanel.vue';

    import itemRepository from '../repository/ItemRepository.js';
    import {loadAvatars, loadScreenshots} from '../operations/ImagesLoader.js';
    import DeleteItemOperation from '../operations/DeleteItem.js';
    import DownloadVersionsDialog from "../components/DownloadVersionsDialog";

    export default {
        name: 'MainWindow',

        data () {
            return {
                /**
                 * If info dialog should be shown.
                 */
                infoDialogOpened : false,

                /**
                 * Message to be shown in the info dialog.
                 */
                infoMessage : '',

                /**
                 * Is information snackbar opened.
                 */
                infoSnackbarOpened : false,

                /**
                 * Message to show inside snackbar.
                 */
                infoSnackbarMessage : '',

                /**
                 * If navigation panel should be shown.
                 */
                showNavigation : false,

                /**
                 * If loading dialog should be shown.
                 */
                showLoading : false,

                /**
                 * If settings dialog should be shown.
                 */
                showSettings : false,

                /**
                 * If info about last update should be shown.
                 */
                showLastUpdate : false,

                /**
                 * Current page numer (calculated from 1).
                 */
                currentPage : 1,

                /**
                 * Number of items per page.
                 */
                itemsPerPage : 20,

                /**
                 * Number of total items that can be displayed (regardless of per page limit).
                 */
                totalItemsCount : 0,

                /**
                 * Items displayed on the current page.
                 */
                items : [],

                /**
                 * Should delete dialog be opened.
                 */
                deleteDialogOpened : false,

                /**
                 * Item to be deleted.
                 */
                itemToDelete : {
                    id : 0,
                    name : '',
                },

                /**
                 * Very important object containing core settings for core functionality - filters :)
                 */
                filters : {
                    /**
                     * Category ID that items will be filtered for.
                     */
                    category : undefined,

                    /**
                     * If true only fav items will be shown.
                     */
                    favorites : undefined,

                    /**
                     * If true only updated items will be shown.
                     */
                    updated : undefined,

                    /**
                     * If true only archived items will be shown.
                     */
                    archived : false,

                    /**
                     * Name of the item to search for.
                     */
                    name : '',

                    /**
                     * If item is in state of development.
                     */
                    inDevelopment : undefined,

                    /**
                     * If item is completed.
                     */
                    completed : undefined,

                    /**
                     * Minimum rating to filter results.
                     */
                    rating : undefined,

                    /**
                     * Tags to search for.
                     */
                    tags : [],
                },

                sortOrder : {
                    field : 'name',
                    order : 'asc',
                },

                /**
                 * Is filter defined.
                 */
                isFilterDefined : false,

                /**
                 * Is filter popover visible.
                 */
                isFilterVisible : false,

                /**
                 * Is sorting panel is visible.
                 */
                isSortVisible : false,
            }
        },

        computed : {
            ...mapGetters(['dbName']),

            filterBtnColor () {
                return this.isFilterDefined ? 'primary' : 'grey';
            },

            lastVersionUpdateDate () {
                const settingsDate = this.$store.getters.settings.lastVersionUpdate;

                if (!settingsDate) {
                    return this.$t('never');
                } else {
                    return moment(settingsDate).locale(remote.app.getLocale()).fromNow();
                }
            },

            /**
             * Total number pages.
             *
             * @returns {number}
             */
            totalPages () {
                return Math.ceil(this.totalItemsCount / this.itemsPerPage);
            },

            /**
             * Unlock dialog will be shown if password is empty.
             *
             * @returns {boolean}
             */
            showUnlockDialog () {
                return this.$store.getters.dbPassword === '';
            },
        },

        methods : {
            filtersChanged (newFilters) {
                this.filters.name = newFilters.name;
                this.filters.inDevelopment = newFilters.inDevelopment;
                this.filters.completed = newFilters.completed;
                this.filters.rating = newFilters.rating;
                this.filters.tags = newFilters.tags;
                this.isFilterVisible = false;

                this.countItems();
            },

            /**
             * Opens dialog with form to add new items.
             */
            showAddNewItemForm () {
                this.$refs.itemFormDialog.show(this.$t('item.addNew'));
            },

            itemSaved (item) {
                this.updateItemData(item);
            },

            /**
             * Loads data after unlocking the database.
             */
            initData () {
                this.$store.dispatch('loadTags');
                this.$store.dispatch('loadCategories');
                this.countItems();
            },

            showEditDialog (item) {
                this.$refs.itemFormDialog.showEdit(item);
            },

            /**
             * Updates item on the list or adds it to the beginning if it if item is not on the list.
             *
             * @param {Object} item
             */
            updateItemData (item) {
                let index = this.items.findIndex(i => i._id === item._id);

                if (index > -1) {
                    // need to update item on the list
                    this.items.splice(index, 1, item);
                } else {
                    this.items.unshift(item);
                    this.totalItemsCount++;
                }
            },

            /**
             * Updates all item versions.
             */
            updateAllItemsVersion () {
                this.$refs.downloadVersionsDialog.start();
            },

            /**
             * Performs items count and reloads items list.
             */
            countItems () {
                this.showLoading = true;

                itemRepository.countTotal(this.filters).then(count => {
                    this.totalItemsCount = count;

                    this.reloadItems();
                }).catch((err) => {
                    this.showLoading = false;
                    this.showInfoDialog(err + ' ');
                });
            },

            /**
             * Reloads items list.
             */
            reloadItems () {
                if (this.totalItemsCount < 1) {
                    this.items = [];
                    this.showLoading = false;
                    return;
                }

                this.showLoading = true;

                const start = (this.currentPage - 1) * this.itemsPerPage;

                itemRepository.find(start, this.itemsPerPage, this.filters, this.sortOrder).then(items => {
                    for (let item of items) {
                        item.avatarImage = ''; // adding property that is not saved to the database
                    }

                    this.showLoading = false;

                    this.items = items;

                    loadAvatars(items);
                }).catch((err) => {
                    this.showLoading = false;
                    this.showInfoDialog(err + ' ');
                });
            },

            /**
             * Opens screenshots dialog.
             *
             * @param {Object} item Item for which screenshots will be shown.
             */
            showScreenshots (item) {
                this.showLoading = true;
                loadScreenshots(item).then(screenshots => {
                    this.showLoading = false;

                    let screenUrls = [];

                    for (let scr of screenshots) {
                        screenUrls.push(scr.toDataURL());
                    }

                    this.$refs.screenshotsDialog.show(item.name, screenUrls);
                }, (err) => {
                    this.showLoading = false;
                    this.showInfoDialog(err + ' ');
                });
            },

            /**
             * Shows or hides loading.
             *
             * @param {boolean} loading If loading dialog should be visible.
             */
            setLoading (loading) {
                this.showLoading = loading;
            },

            /**
             * Opens info dialog with message.
             *
             * @param {string} message Message to be displayed.
             */
            showInfoDialog (message) {
                this.infoMessage = message;
                this.infoDialogOpened = true;
            },

            /**
             * Opens info snackbar with a message.
             *
             * @param {string} message Message to be displayed.
             */
            showInfoSnackbar (message) {
                this.infoSnackbarMessage = message;
                this.infoSnackbarOpened = true;
            },

            showFavorites () {
                this.filters.category = undefined;
                this.filters.favorites = true;
                this.filters.archived = false;
                this.filters.updated = undefined;
                this.showLastUpdate = false;

                this.countItems();
            },

            showUpdated () {
                this.filters.category = undefined;
                this.filters.favorites = undefined;
                this.filters.archived = false;
                this.filters.updated = true;
                this.showLastUpdate = true;

                this.countItems();
            },

            showAll () {
                this.filters.category = undefined;
                this.filters.favorites = undefined;
                this.filters.archived = false;
                this.filters.updated = undefined;
                this.showLastUpdate = false;

                this.countItems();
            },

            showArchive () {
                this.filters.category = undefined;
                this.filters.favorites = undefined;
                this.filters.archived = true;
                this.filters.updated = undefined;
                this.showLastUpdate = false;

                this.countItems();
            },

            showCategory (categoryId) {
                this.filters.category = categoryId;
                this.filters.favorites = undefined;
                this.filters.archived = false;
                this.filters.updated = undefined;
                this.showLastUpdate = false;

                this.countItems();
            },

            closeDeleteDialog () {
                this.deleteDialogOpened = false;
                this.itemToDelete.id = 0;
                this.itemToDelete.name = '';
            },

            openDeleteDialog (item) {
                this.itemToDelete.id = item._id;
                this.itemToDelete.name = item.name;
                this.deleteDialogOpened = true;
            },

            deleteItem () {
                this.setLoading(true);

                const op = new DeleteItemOperation(this.itemToDelete.id);
                op.execute().then(() => {
                    this.setLoading(false);
                    this.closeDeleteDialog();
                    this.countItems();
                }).catch(err => {
                    this.setLoading(false);
                    this.showInfoDialog(err + ' ');
                });
            }
        },

        watch : {
            currentPage () {
                this.reloadItems();
            },

            sortOrder () {
                this.reloadItems();
            }
        },

        components : {
            DownloadVersionsDialog,
            SortPanel,
            Navigation,
            UnlockDialog,
            ItemsTable,
            ItemFormDialog,
            SettingsDialog,
            FiltersPanel,
            ScreenshotsDialog,
        },
    };
</script>

<style scoped>

</style>