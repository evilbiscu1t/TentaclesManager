<template>
    <v-dialog v-model="isVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-card>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="hide">
                    <v-icon>close</v-icon>
                </v-btn>
                <v-toolbar-title>{{ title }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn dark flat @click="saveForm"><v-icon dark class="mr-2">save</v-icon> {{ $t('save') }}</v-btn>
                </v-toolbar-items>
            </v-toolbar>

            <v-layout row wrap>
                <v-flex xs12 sm12 md6>
                    <v-form class="pa-3" ref="form">
                        <v-text-field :counter="250" :label="$t('item.name')" v-model="values.name" :rules="[validationRules.required]" @contextmenu="showStandardTextMenu"></v-text-field>
                        <v-select :label="$t('item.category')" :items="availableCategories" clearable item-text="name" item-value="_id" v-if="availableCategories.length" v-model="values.categoryId"></v-select>
                        <v-textarea :label="$t('item.description')" v-model="values.description" @contextmenu="showStandardTextMenu"></v-textarea>
                        <v-text-field v-if="settings.patreonLinkVisibility === 'show'" :label="$t('item.patreonLink')" v-model="values.patreon" prefix="https://patreon.com/" @paste="patreonLinkPaste" @contextmenu="showStandardTextMenu"></v-text-field>
                        <v-text-field v-if="settings.wwwLinkVisibility === 'show'" :label="$t('item.www')" v-model="values.www" :rules="[validationRules.url]" @contextmenu="showStandardTextMenu"></v-text-field>
                        <v-text-field v-if="settings.f95LinkVisibility === 'show'" :label="$t('item.f95link')" v-model="values.f95" prefix="https://f95zone.to/threads/" @paste="f95LinkPaste" @contextmenu="showStandardTextMenu" append-icon="cloud_download" @click:append="downloadMetadataFromF95"></v-text-field>
                        <v-text-field v-if="settings.itchLinkVisibility === 'show'" :label="$t('item.itchLink')" v-model="values.itch" :rules="[validationRules.url]" @contextmenu="showStandardTextMenu"></v-text-field>
                        <v-text-field v-if="settings.subscribeStarLinkVisibility === 'show'" :label="$t('item.subscribeStarLink')" v-model="values.subscribeStar" prefix="https://subscribestar.adult/" @paste="subscribeStarLinkPaste" @contextmenu="showStandardTextMenu" append-icon="cloud_download" @click:append="downloadMetadataFromSubscribeStar"></v-text-field>
                        <v-text-field v-if="settings.currentVersionVisibility === 'show'" :label="$t('item.currentVersion')" v-model="values.currentVersion" @contextmenu="showStandardTextMenu"></v-text-field>
                        <v-text-field v-if="settings.ownedVersionVisibility === 'show'" :label="$t('item.ownedVersion')" v-model="values.ownedVersion" @contextmenu="showStandardTextMenu"></v-text-field>
                        <span class="grey--text text--darken-2">{{ $t('item.rating') }}</span>
                        <v-rating v-model="values.rating" hover></v-rating>
                        <span class="grey--text text--darken-2">{{ $t('item.tags') }}</span>
                        <TagInput v-model="values.tags" ref="tagInput" />
                        <v-layout row wrap>
                            <v-flex xs4>
                                <v-checkbox :label="$t('item.archived')" v-model="values.archived" color="primary"></v-checkbox>
                            </v-flex>
                            <v-flex xs4>
                                <v-checkbox :label="$t('item.favorite')" v-model="values.favorite" color="primary"></v-checkbox>
                            </v-flex>
                            <v-flex xs4>
                                <v-checkbox :label="$t('item.inDevelopment')" v-model="values.inDevelopment" color="primary"></v-checkbox>
                            </v-flex>
                            <v-flex xs4>
                                <v-checkbox :label="$t('item.completed')" v-model="values.completed" color="primary"></v-checkbox>
                            </v-flex>
                        </v-layout>
                    </v-form>
                </v-flex>
                <v-flex xs12 sm12 md6 class="pa-3">
                    <v-expansion-panel>
                        <v-expansion-panel-content>
                            <template #header>
                                <div><v-icon small>camera</v-icon> {{ $t('icon') }}</div>
                            </template>
                            <v-card>
                                <v-card-text style="text-align: center;">
                                    <v-avatar color="primary" size="100px">
                                        <img v-if="avatarImage" :src="avatarImage" alt="Avatar">
                                        <span v-else class="white--text headline">{{ values.name | firstLetter }}</span>
                                    </v-avatar>
                                </v-card-text>
                                <v-card-actions>
                                    <v-btn flat color="secondary" @click="loadAvatarFromFile"><v-icon class="mr-1">folder_open</v-icon> {{ $t('item.screen.openFromFile') }}</v-btn>
                                    <v-menu :close-on-content-click="false" v-model="iconAddFromUrlOpen"
                                            :nudge-width="350">
                                        <template #activator="{ on }">
                                            <v-btn flat color="secondary" v-on="on"><v-icon class="mr-1">public</v-icon> {{ $t('item.screen.loadFromUrl') }}</v-btn>
                                        </template>

                                        <DownloadFromUrlPopup ref="iconDownloadPopup" @download-clicked="setAvatarFromUrl" />
                                    </v-menu>
                                    <v-btn flat color="secondary" @click="loadAvatarFromClipboard"><v-icon class="mr-1">file_copy</v-icon> {{ $t('item.screen.loadClipboard') }}</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-expansion-panel-content>

                        <v-expansion-panel-content>
                            <template #header>
                                <div><v-icon small>image</v-icon> {{ $t('item.screenshots') }}</div>
                            </template>
                            <v-card>
                                <v-card-text>
                                    <v-container grid-list-sm fluid>
                                        <v-layout row wrap>
                                            <v-flex v-for="screen in screenshots" xs4 d-flex :key="screen.id">
                                                <v-hover>
                                                    <v-card tile class="d-flex" slot-scope="{ hover }" :class="`elevation-${hover ? 12 : 2}`">
                                                        <v-img :src="screen.preview" aspect-ratio="1" @contextmenu="showScreenshotsContextMenu(screen)" />
                                                    </v-card>
                                                </v-hover>
                                            </v-flex>
                                        </v-layout>
                                    </v-container>
                                </v-card-text>
                                <v-card-actions>
                                    <v-btn flat color="secondary" @click="openScreenImagesFromFile"><v-icon class="mr-1">folder_open</v-icon> {{ $t('item.screen.openFromFile') }}</v-btn>

                                    <v-menu :close-on-content-click="false" v-model="screenAddFromUrlOpen"
                                            :nudge-width="350">
                                        <template #activator="{ on }">
                                            <v-btn flat color="secondary" v-on="on"><v-icon class="mr-1">public</v-icon> {{ $t('item.screen.loadFromUrl') }}</v-btn>
                                        </template>

                                        <DownloadFromUrlPopup ref="screenDownloadPopup" @download-clicked="addScreenFromUrl" />
                                    </v-menu>
                                    <v-btn flat color="secondary" @click="addScreenFromClipboard"><v-icon class="mr-1">file_copy</v-icon> {{ $t('item.screen.loadClipboard') }}</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-expansion-panel-content>

                        <v-expansion-panel-content v-if="showAdditionalDataPanel">
                            <template #header>
                                <div><v-icon small>widgets</v-icon> {{ $t('item.additionalData') }}</div>
                            </template>
                            <v-card class="mx-3">
                                <v-card-title primary-title>
                                    <v-flex xs12 sm12 md12>
                                        <v-text-field v-if="settings.patreonLinkVisibility === 'panel'" :label="$t('item.patreonLink')" v-model="values.patreon" prefix="https://patreon.com/" @paste="patreonLinkPaste" @contextmenu="showStandardTextMenu"></v-text-field>
                                        <v-text-field v-if="settings.wwwLinkVisibility === 'panel'" :label="$t('item.www')" v-model="values.www" :rules="[validationRules.url]" @contextmenu="showStandardTextMenu"></v-text-field>
                                        <v-text-field v-if="settings.f95LinkVisibility === 'panel'" :label="$t('item.f95link')" v-model="values.f95" prefix="https://f95zone.to/threads/" @paste="f95LinkPaste" @contextmenu="showStandardTextMenu" append-icon="cloud_download" @click:append="downloadMetadataFromF95"></v-text-field>
                                        <v-text-field v-if="settings.itchLinkVisibility === 'panel'" :label="$t('item.itchLink')" v-model="values.itch" :rules="[validationRules.url]" @contextmenu="showStandardTextMenu"></v-text-field>
                                        <v-text-field v-if="settings.subscribeStarLinkVisibility === 'panel'" :label="$t('item.subscribeStarLink')" prefix="https://subscribestar.adult/" v-model="values.subscribeStar" @paste="subscribeStarLinkPaste" @contextmenu="showStandardTextMenu"  append-icon="cloud_download" @click:append="downloadMetadataFromSubscribeStar"></v-text-field>
                                        <v-text-field v-if="settings.currentVersionVisibility === 'panel'" :label="$t('item.currentVersion')" v-model="values.currentVersion" @contextmenu="showStandardTextMenu"></v-text-field>
                                        <v-text-field v-if="settings.ownedVersionVisibility === 'panel'" :label="$t('item.ownedVersion')" v-model="values.ownedVersion" @contextmenu="showStandardTextMenu"></v-text-field>
                                    </v-flex>
                                </v-card-title>
                            </v-card>
                        </v-expansion-panel-content>

                        <v-expansion-panel-content>
                            <template #header>
                                <div><v-icon small>public</v-icon> {{ $t('links') }}</div>
                            </template>
                            <LinksEditor v-model="values.links" />
                        </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-alert :value="showDuplicatesWarning" type="warning">
                        {{ duplicatesWarningText }}
                    </v-alert>
                </v-flex>
            </v-layout>
        </v-card>
        <ImageEditDialog ref="imageEditDialog" @image-saved="onImageEdited" />
    </v-dialog>
</template>

<script>
    import {remote, clipboard, nativeImage} from 'electron';
    import {debounce} from 'debounce';

    import LinksEditor from './LinksEditor.vue';
    import TagInput from './TagInput.vue';
    import ImageEditDialog from './ImageEditDialog.vue';
    import DownloadFromUrlPopup from './DownloadFromUrlPopup.vue';

    import SaveItemOperation from '../operations/SaveItem.js';
    import itemRepository from '../repository/ItemRepository.js';
    import {loadScreenshots} from '../operations/ImagesLoader.js';
    import {standardTextMenu} from '../../main/menu.js';

    const mainProcess = remote.require('./main.js');

    /**
     * Context menu for screenshots.
     *
     * @property {Menu}
     */
    let screenshotsMenu;

    /**
     * Searches for other items with the same Patreon link.
     *
     * @property {Function}
     */
    let searchForPatreonFn;

    export default {
        name: 'ItemFormDialog',

        data () {
            return {
                /**
                 * Determines if dialog should be visible.
                 */
                isVisible : false,

                /**
                 * Dialogs title.
                 */
                title : '',

                /**
                 * ID of the edited item. Empty string if item is added to database.
                 */
                itemId : '',

                /**
                 * Form values
                 */
                values : {
                    name : '',
                    description : '',
                    rating : 0,
                    patreon : '',
                    www : '',
                    f95 : '',
                    itch : '',
                    subscribeStar : '',
                    currentVersion : '',
                    ownedVersion : '',
                    inDevelopment : false,
                    favorite : false,
                    archived : false,
                    completed : false,

                    links : [],
                    tags : [],

                    categoryId : '',
                },

                /**
                 * @property {[{id: number, image: NativeImage, preview: string}]}
                 */
                screenshots : [],

                /**
                 * Data url with avatar.
                 */
                avatarImage : '',

                /**
                 * Last number used as an ID for screenshots (to use as key for vue)
                 */
                screenshotsIdSeq : 0,

                /**
                 * Controls which part of the form is edited by image editor.
                 */
                imageEditMode : 'avatar',

                /**
                 * ID for the currently selected screens.
                 */
                selectedScreenId : 0,

                /**
                 * Is add screen from url popup is opened.
                 */
                screenAddFromUrlOpen : false,

                /**
                 * Is add icon from url popup is opened.
                 */
                iconAddFromUrlOpen : false,

                /**
                 * Is duplicates warning should be shown.
                 */
                showDuplicatesWarning : false,

                /**
                 * Text to display in duplicates warning.
                 */
                duplicatesWarningText : '',

                validationRules : {
                    /**
                     * Tests if the given url address is correct.
                     *
                     * @param {string} value Value to test
                     * @returns {boolean} TRUE if value is correct. Error message otherwise.
                     */
                    url : value => {
                        if (!value) {
                            return true;
                        }

                        const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

                        if (!urlRegex.test(value)) {
                            return this.$t('validation.incorrectUrl');
                        } else {
                            return true;
                        }
                    },

                    /**
                     * Tests minimum length of the field.
                     *
                     * @param {string} value Value to test
                     * @returns {boolean} TRUE if value is correct. Error message otherwise.
                     */
                    required : value => {
                        value = value.trim();

                        if (!value || value.length < 3) {
                            return this.$t('validation.minLength', {minLength: 3});
                        } else {
                            return true;
                        }
                    }
                }
            };
        },

        computed : {
            availableCategories () {
                return this.$store.getters.categories;
            },

            patreonLink () {
                return this.values.patreon;
            },

            settings () {
                return this.$store.getters.settings;
            },

            /**
             * Detects if settings are set in a way that requires additional data panel to be shown.
             *
             * @return {boolean} true if panel will be shown
             */
            showAdditionalDataPanel () {
                const configItems = ['patreonLinkVisibility', 'wwwLinkVisibility', 'f95LinkVisibility', 'itchLinkVisibility',
                    'currentVersionVisibility', 'ownedVersionVisibility'];
                const settings    = this.$store.getters.settings;

                for (let i of configItems) {
                    if (settings[i] === 'panel') {
                        return true;
                    }
                }
                return false;
            },
        },

        methods : {
            show (title) {
                this.title     = title;
                this.isVisible = true;

                if (!this.itemId) {
                    // new item form is shown
                    // test to see if there is a link in clipboard
                    const text = clipboard.readText();

                    if (text && this.validationRules.url(text) === true) {
                        // clipboard contains url
                        const match = /(https:\/\/)?(www\.)?patreon.com\/(.*)/.exec(text);
                        if (match) {
                            if (this.settings.patreonLinkVisibility === 'show') {
                                this.values.patreon = match[match.length - 1];
                            }
                        } else {
                            const match = /(https:\/\/)?(www\.)?f95zone\.(to|com)\/threads\/(.*)/.exec(text);
                            if (match) {
                                if (this.settings.f95LinkVisibility === 'show') {
                                    this._extractF95Topic(match);
                                }
                            } else {
                                if (text.indexOf('itch.io') > -1) {
                                    if (this.settings.itchLinkVisibility === 'show') {
                                        this.values.itch = text;
                                    }
                                } else {
                                    const match = /(https:\/\/)?(www\.)?subscribestar\.adult\/(.*)/.exec(text);
                                    if (match) {
                                        if (this.settings.subscribeStarLinkVisibility === 'show') {
                                            this.values.subscribeStar = match[match.length - 1];
                                        }
                                    } else if (this.settings.wwwLinkVisibility === 'show') {
                                        this.values.www = text;
                                    }
                                }
                            }
                        }
                    }
                }
            },

            showEdit (item) {
                this.itemId               = item._id;
                this.values.name          = item.name;
                this.values.description   = item.description;
                this.values.rating        = item.rating;
                this.values.patreon       = item.patreon;
                this.values.www           = item.www;
                this.values.inDevelopment = item.inDevelopment;
                this.values.archived      = item.archived;
                this.values.favorite      = item.favorite;
                this.values.links         = item.links;
                this.values.tags          = item.tags;
                this.values.completed     = item.completed;
                this.avatarImage          = item.avatarImage;

                if ('f95' in item) this.values.f95 = item.f95;
                if ('itch' in item) this.values.itch = item.itch;
                if ('currentVersion' in item) this.values.currentVersion = item.currentVersion;
                if ('ownedVersion' in item) this.values.ownedVersion = item.ownedVersion;
                if ('subscribeStar' in item) this.values.subscribeStar = item.subscribeStar;

                if (item.category) {
                    this.values.categoryId = item.category.id;
                }

                this.$refs.tagInput.setTags(item.tags.slice(0));

                this.show(item.name);

                loadScreenshots(item).then(images => {
                    for (let image of images) {
                        this.screenshots.push({id: ++this.screenshotsIdSeq, image, preview: image.resize({width: 200}).toDataURL()});
                    }
                });
            },

            hide () {
                this.isVisible = false;
                this.clearForm();
            },

            /**
             * Clears all values from the form.
             */
            clearForm () {
                this.values.name = '';
                this.values.description = '';
                this.values.rating = 0;
                this.values.patreon = '';
                this.values.www = '';
                this.values.f95 = '';
                this.values.itch = '';
                this.values.subscribeStar = '';
                this.values.currentVersion = '';
                this.values.ownedVersion = '';
                this.values.inDevelopment = false;
                this.values.favorite = false;
                this.values.archived = false;
                this.values.completed = false;
                this.values.links = [];
                this.values.tags = [];
                this.screenshots = [];
                this.screenshotsIdSeq = 0;
                this.itemId = '';
                this.avatarImage = '';
                this.values.categoryId = '';

                this.showDuplicatesWarning = false;
                this.duplicatesWarningText = '';

                this.$refs.tagInput.setTags([]);
                this.$refs.form.resetValidation();
            },

            saveForm () {
                if (!this.$refs.form.validate()) {
                    return;
                }

                this.$emit('loading-status-changed', true);

                let category = null;
                if (this.values.categoryId) {
                    // category is selected
                    const cat = this.availableCategories.find(c => c._id === this.values.categoryId);
                    if (cat) {
                        category = {
                            id    : cat._id,
                            name  : cat.name,
                            color : cat.color,
                            dark  : cat.dark
                        };
                    }
                }

                const op = new SaveItemOperation(this.itemId, {
                    name          : this.values.name,
                    description   : this.values.description,
                    rating        : this.values.rating,
                    patreon       : this.values.patreon,
                    www           : this.values.www,
                    f95           : this.values.f95,
                    itch          : this.values.itch,
                    subscribeStar : this.values.subscribeStar,
                    inDevelopment : this.values.inDevelopment,
                    completed     : this.values.completed,
                    archived      : this.values.archived,
                    favorite      : this.values.favorite,
                    links         : this.values.links,
                    currentVersion: this.values.currentVersion,
                    ownedVersion  : this.values.ownedVersion,
                    category,

                    tags          : this.$refs.tagInput.getTags(),
                    avatar        : !!this.avatarImage,
                }, this.screenshots, this.avatarImage);

                op.save().then((savedItem) => {
                    this.$emit('loading-status-changed', false);
                    this.hide();

                    this.$emit('form-saved', savedItem);
                }, () => {
                    this.$emit('loading-status-changed', false);
                });
            },

            /**
             * Opens images from files and imports them into screenshots panel.
             */
            openScreenImagesFromFile () {
                mainProcess.chooseImages(remote.getCurrentWindow(), this.$t('images')).then(result => {
                    if (result.canceled || !result.filePaths.length) {
                        return;
                    }

                    const files = result.filePaths;

                    this.$emit('loading-status-changed', true);

                    for (let file of files) {
                        const image = nativeImage.createFromPath(file);

                        this.screenshots.push({id: ++this.screenshotsIdSeq, image, preview: image.resize({width: 200}).toDataURL()});
                    }

                    this.$emit('loading-status-changed', false);
                });
            },

            /**
             * Loads icon from local file.
             */
            loadAvatarFromFile () {
                this.imageEditMode = 'avatar';
                this.$refs.imageEditDialog.show(this.$t('icon'));
            },

            /**
             * Method fired after image editing is completed.
             *
             * @param {string} imageData Image data URL.
             */
            onImageEdited (imageData) {
                if (this.imageEditMode === 'avatar') {
                    this.avatarImage = imageData;
                }
            },

            /**
             * Opens screenshots context menu.
             *
             * @param {Object} screen Screen that is subject for popup menu.
             */
            showScreenshotsContextMenu (screen) {
                this.selectedScreenId = screen.id;

                screenshotsMenu.popup();
            },

            /**
             * Deletes currently selected screen.
             */
            deleteSelectedScreen () {
                const index = this.screenshots.findIndex(scr => scr.id === this.selectedScreenId);

                if (index > -1) {
                    this.screenshots.splice(index, 1);
                }
            },

            /**
             * Creates icon from currently selected screen.
             */
            createIconFromSelectedScreen () {
                const screen = this.screenshots.find(scr => scr.id === this.selectedScreenId);

                if (screen) {
                    this.imageEditMode = 'avatar';
                    this.$refs.imageEditDialog.show(this.$t('icon'), screen.image.toDataURL());
                }
            },

            /**
             * Extracts patreon login from link pasted into the field.
             */
            patreonLinkPaste () {
                setTimeout(() => {
                    if (!this.values.patreon) {
                        return;
                    }

                    const match = /(https:\/\/)?(www\.)?patreon\.com\/(.*)/.exec(this.values.patreon);
                    if (match) {
                        this.values.patreon = match[match.length - 1];
                    }
                }, 500);
            },

            /**
             * Extracts Subscribe Star creator name from link pasted into the field.
             */
            subscribeStarLinkPaste () {
                setTimeout(() => {
                    if (!this.values.subscribeStar) {
                        return;
                    }

                    const match = /(https:\/\/)?(www\.)?subscribestar\.adult\/(.*)/.exec(this.values.subscribeStar);
                    if (match) {
                        this.values.subscribeStar = match[match.length - 1];
                    }
                }, 500);
            },

            /**
             * Extracts topic name from F95 links.
             */
            f95LinkPaste () {
                setTimeout(() => {
                    if (!this.values.f95) {
                        return;
                    }

                    const match = /(https:\/\/)?(www\.)?f95zone\.(to|com)\/threads\/(.*)/.exec(this.values.f95);
                    if (match) {
                        this._extractF95Topic(match);
                    }
                }, 500);
            },

            /**
             * Extracts F95 topic from regexp result.
             */
            _extractF95Topic (match) {
                let topicPath = match[match.length - 1];
                if (topicPath.lastIndexOf('/') > 0) {
                    topicPath = topicPath.substr(0, topicPath.lastIndexOf('/')); // cut out page number
                }

                this.values.f95 = topicPath;
            },

            /**
             * Downloads metadata directly from F95 topic
             */
            downloadMetadataFromF95 () {
                if (!this.values.f95) {
                    return;
                }

                this.$emit('loading-status-changed', true);
                mainProcess.downloadF95Metadata(this.values.f95, data => {
                    this.$emit('loading-status-changed', false);

                    this.values.name = data.title;

                    if (data.completed) {
                        this.values.completed = true;
                    }

                    if (data.version && this.settings.currentVersionVisibility !== 'hide') {
                        this.values.currentVersion = data.version;
                    }

                    this.values.tags = data.tags;

                    this.$refs.tagInput.setTags(data.tags.slice(0));
                });
            },

            /**
             * Downloads data from Subscribe Star.
             */
            downloadMetadataFromSubscribeStar () {
                if (!this.values.subscribeStar) {
                    return;
                }

                this.$emit('loading-status-changed', true);
                mainProcess.downloadSubscribeStarMetadata(this.values.subscribeStar, data => {
                    this.$emit('loading-status-changed', false);

                    if (data.tags && data.tags.length) {
                        this.values.tags = data.tags;

                        this.$refs.tagInput.setTags(data.tags.slice(0));
                    }

                    if (data.description) {
                        this.values.description = data.description;
                    }

                    if (data.avatar) {
                        this.setAvatarFromUrl(data.avatar);
                    }
                });
            },

            /**
             * Adds new screen from the given url address.
             *
             * @param {string} url URL of the image.
             */
            addScreenFromUrl (url) {
                this.screenAddFromUrlOpen = false;
                this.$emit('loading-status-changed', true);
                mainProcess.downloadFile(url).then(buffer => {
                    this.$emit('loading-status-changed', false);
                    const image = nativeImage.createFromBuffer(buffer);

                    if (!image.isEmpty()) {
                        this.screenshots.push({id : ++this.screenshotsIdSeq, image : image, preview: image.resize({width: 200}).toDataURL()});
                    } else {
                        this.$emit('show-error', this.$t('error.noImageUnderUrl'));
                    }
                }).catch(() => {
                    this.$emit('loading-status-changed', false);
                    this.$emit('show-error', this.$t('error.unableToReadFromUrl'));
                });
            },

            /**
             * Adds image from clipboard to screens list.
             */
            addScreenFromClipboard () {
                const image = clipboard.readImage();

                if (image && !image.isEmpty()) {
                    this.screenshots.push({id : ++this.screenshotsIdSeq, image : image, preview: image.resize({width: 200}).toDataURL()});
                } else {
                    this.$emit('show-error', this.$t('error.clipboardDoesNotContainImage'));
                }
            },

            /**
             * Sets avatar from the given url address.
             *
             * @param {string} url URL of the image.
             */
            setAvatarFromUrl (url) {
                this.iconAddFromUrlOpen = false;
                this.$emit('loading-status-changed', true);
                mainProcess.downloadFile(url).then(buffer => {
                    this.$emit('loading-status-changed', false);
                    const image = nativeImage.createFromBuffer(buffer);

                    if (!image.isEmpty()) {
                        this.imageEditMode = 'avatar';
                        this.$refs.imageEditDialog.show(this.$t('icon'), image.toDataURL());
                    } else {
                        this.$emit('show-error', this.$t('error.noImageUnderUrl'));
                    }
                }).catch(() => {
                    this.$emit('loading-status-changed', false);
                    this.$emit('show-error', this.$t('error.unableToReadFromUrl'));
                });
            },

            /**
             * Sets avatar from image in clipboard.
             */
            loadAvatarFromClipboard () {
                const image = clipboard.readImage();

                if (image && !image.isEmpty()) {
                    this.imageEditMode = 'avatar';
                    this.$refs.imageEditDialog.show(this.$t('icon'), image.toDataURL());
                } else {
                    this.$emit('show-error', this.$t('error.clipboardDoesNotContainImage'));
                }
            },

            showStandardTextMenu () {
                standardTextMenu().popup();
            }
        },

        filters : {
            /**
             * Filter returning only first letter of a string.
             *
             * @param {string} value
             * @returns {string}
             */
            firstLetter (value) {
                if (value) {
                    return value.substr(0, 1);
                }
                return '';
            }
        },

        created () {
            screenshotsMenu = remote.Menu.buildFromTemplate([
                {
                    label : this.$t('delete'),
                    click : this.deleteSelectedScreen,
                },
                {
                    label : this.$t('item.screen.createIcon'),
                    click : this.createIconFromSelectedScreen,
                }
            ]);

            searchForPatreonFn = debounce(() => {
                const patreonLink = this.values.patreon;

                if (patreonLink) {
                    itemRepository.findByPatreon(patreonLink).then(items => {
                        let duplicates = [];

                        for (let item of items) {
                            if (item._id !== this.itemId) {
                                duplicates.push(item.name);
                            }
                        }

                        if (duplicates.length) {
                            this.duplicatesWarningText = this.$t('duplicatesWarning', {names: duplicates.join(', ')});
                            this.showDuplicatesWarning = true;
                        } else {
                            this.showDuplicatesWarning = false;
                        }
                    });
                } else {
                    this.showDuplicatesWarning = false;
                }
            }, 1000);
        },

        watch : {
            screenAddFromUrlOpen : {
                handler : function (newValue) {
                    if (!newValue) {
                        this.$refs.screenDownloadPopup.clearData();
                    }
                }
            },
            iconAddFromUrlOpen : {
                handler : function (newValue) {
                    if (!newValue) {
                        this.$refs.iconDownloadPopup.clearData();
                    }
                }
            },
            patreonLink : {
                handler : function () {
                    searchForPatreonFn();
                }
            }
        },

        components : {
            DownloadFromUrlPopup,
            LinksEditor,
            ImageEditDialog,
            TagInput,
        }
    };

    /**
     * @event ItemFormDialog#form-saved
     *
     * Event emitted after successful save of the form.
     *
     * @param {Object} savedItem Saved items data.
     */
</script>

<style scoped>

</style>