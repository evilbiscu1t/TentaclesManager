import Vue from 'vue';
import Vuex from 'vuex';
import path from 'path';

import itemRepository from '../repository/ItemRepository.js';
import tagsRepository from '../repository/TagsRepository.js';
import categoryRepository from '../repository/CategoryRepository.js';
import DatabaseSettings from '../lib/DatabaseSettings.js';
import encryptionManager from '../lib/EncryptionManager.js';

/**
 * Saves application settings into database.
 *
 * @param {Object} context Store context.
 * @returns {Promise<void>}
 */
function saveSettingsToDb(context) {
    const dbSettings = new DatabaseSettings(context.getters.dbFile);
    dbSettings.setSettings(context.getters.settings);

    return dbSettings.save(encryptionManager.getEncryption());
}

/**
 * Applications state managed by Vuex.
 */
const state = {
    /**
     * Full path to the database file.
     */
    dbFile: '',

    /**
     * Password for the database.
     */
    dbPassword : '',

    /**
     * List of all tags in the database.
     */
    tags : [],

    /**
     * List of all categories in the database.
     */
    categories : [],

    /**
     * Object with current database settings.
     */
    settings : {
        imageQuality : 85,
        linkClickAction : 'open',
        patreonClickAction : 'open',

        patreonLinkVisibility: 'show',
        wwwLinkVisibility: 'show',
        f95LinkVisibility: 'panel',
        itchLinkVisibility: 'panel',
    },
};

const mutations = {
    SET_DB_FILE (state, file) {
        state.dbFile = file;
    },

    SET_SETTINGS (state, settings) {
        state.settings.imageQuality = settings.imageQuality;
        state.settings.linkClickAction = settings.linkClickAction;
        state.settings.patreonClickAction = settings.patreonClickAction;

        if ('patreonLinkVisibility' in settings) {
            state.settings.patreonLinkVisibility = settings.patreonLinkVisibility;
        }

        if ('wwwLinkVisibility' in settings) {
            state.settings.wwwLinkVisibility = settings.wwwLinkVisibility;
        }

        if ('f95LinkVisibility' in settings) {
            state.settings.f95LinkVisibility = settings.f95LinkVisibility;
        }

        if ('itchLinkVisibility' in settings) {
            state.settings.itchLinkVisibility = settings.itchLinkVisibility;
        }
    },

    SET_SETTINGS_IMAGE_QUALITY (state, imageQuality) {
        state.settings.imageQuality = imageQuality;
    },

    SET_SETTINGS_LINK_CLICK_ACTION (state, clickAction) {
        state.settings.linkClickAction = clickAction;
    },

    SET_SETTINGS_PATREON_CLICK_ACTION (state, clickAction) {
        state.settings.patreonClickAction = clickAction;
    },

    SET_SETTINGS_PATREON_LINK_VISIBILITY (state, visibility) {
        state.settings.patreonLinkVisibility = visibility;
    },

    SET_SETTINGS_WWW_LINK_VISIBILITY (state, visibility) {
        state.settings.wwwLinkVisibility = visibility;
    },

    SET_SETTINGS_F95_LINK_VISIBILITY (state, visibility) {
        state.settings.f95LinkVisibility = visibility;
    },

    SET_SETTINGS_ITCH_LINK_VISIBILITY (state, visibility) {
        state.settings.itchLinkVisibility = visibility;
    },

    SET_DB_PASSWORD (state, password) {
        state.dbPassword = password;
    },

    ADD_TAGS (state, tags) {
        state.tags.push(...tags);
    },

    /**
     * Adds new category to the beginning of the categories array.
     *
     * @param {Object} state State object.
     * @param {Object} category Category to add.
     */
    ADD_CATEGORY (state, category) {
        state.categories.unshift(category);
    },

    /**
     * Replaces all categories in memory with the given array.
     *
     * @param {Object} state State object.
     * @param {[]} categories Categories.
     */
    SET_CATEGORIES (state, categories) {
        state.categories = categories;
    },

    /**
     * Updates category searching by its _id.
     *
     * @param {Object} state State object.
     * @param {Object} category Category to update.
     */
    UPDATE_CATEGORY (state, category) {
        const cat = state.categories.find(c => c._id === category._id);

        if (cat) {
            cat.name  = category.name;
            cat.color = category.color;
            cat.dark  = category.dark;
        }
    },

    /**
     * Removes category from the store.
     *
     * @param {Object} state State object.
     * @param {string} categoryId ID of the category to remove.
     */
    DELETE_CATEGORY (state, categoryId) {
        const index = state.categories.findIndex(c => c._id === categoryId);

        if (index > -1) {
            state.categories.splice(index, 1)
        }
    },

    /**
     * Removes tag from the store.
     *
     * @param {Object} state State object.
     * @param {string} tag Tag to remove.
     */
    DELETE_TAG (state, tag) {
        const index = state.tags.indexOf(tag);

        if (index > -1) {
            state.tags.splice(index, 1);
        }
    }
};

const actions = {
    setDbFile (context, data) {
        context.commit('SET_DB_FILE', data);
    },

    setDbPassword (context, password) {
        context.commit('SET_DB_PASSWORD', password);
    },

    setSettings (context, data) {
        context.commit('SET_SETTINGS', data);
    },

    /**
     * Adds new tags to the database.
     *
     * @param {Object} context Store context.
     * @param {string[]} tags Tags to add.
     * @returns {Promise<boolean>}
     */
    async addTags (context, tags) {
        let tagsToAdd = [];

        for (let tag of tags) {
            if (context.state.tags.indexOf(tag) === -1) {
                tagsToAdd.push(tag);
            }
        }

        await tagsRepository.addTags(tagsToAdd);

        if (tagsToAdd.length) {
            context.commit('ADD_TAGS', tagsToAdd);
        }

        return true;
    },

    /**
     * Loads tags from the database.
     *
     * @param {Object} context Store context.
     * @returns {Promise<boolean>}
     */
    async loadTags (context) {
        const allTags = await tagsRepository.findAll();
        let tagsToAdd = [];

        for (let tag of allTags) {
            tagsToAdd.push(tag.tag);
        }

        context.commit('ADD_TAGS', tagsToAdd);

        return true;
    },

    /**
     * Adds new category to the list.
     *
     * @param {Object} context Store context.
     * @param {Object} category Category to add.
     * @returns {Promise<boolean>}
     */
    async addCategory (context, category) {
        const cat = await categoryRepository.addCategory(category);

        context.commit('ADD_CATEGORY', cat);

        return true;
    },

    /**
     * Loads categories from the database.
     *
     * @param {Object} context Store context.
     * @returns {Promise<boolean>}
     */
    async loadCategories (context) {
        const allCategories = await categoryRepository.findAll();

        context.commit('SET_CATEGORIES', allCategories);

        return true;
    },

    /**
     * Updates selected category.
     *
     * @param {Object} context Store context.
     * @param {Object} category Category to update.
     * @returns {Promise<boolean>}
     */
    async updateCategory (context, category) {
        await itemRepository.updateCategory(category._id, category);
        await categoryRepository.update(category._id, category.name, category.color, category.dark);

        context.commit('UPDATE_CATEGORY', category);

        return true;
    },

    /**
     * Deletes selected category.
     *
     * @param {Object} context Store context.
     * @param {string} categoryId ID of the category to delete.
     * @returns {Promise<boolean>}
     */
    async deleteCategory (context, categoryId) {
        await itemRepository.deleteCategory(categoryId);
        await categoryRepository.remove(categoryId);

        context.commit('DELETE_CATEGORY', categoryId);

        return true;
    },

    /**
     * Updates image quality settings.
     *
     * @param {Object} context Store context.
     * @param {number} imageQuality New value for image quality.
     * @returns {Promise<void>}
     */
    updateImageQuality (context, imageQuality) {
        context.commit('SET_SETTINGS_IMAGE_QUALITY', imageQuality);

        return saveSettingsToDb(context);
    },

    /**
     * Updates link click action setting.
     *
     * @param {Object} context Store context.
     * @param {string} clickAction New click action.
     * @returns {Promise<void>}
     */
    updateLinkClickAction (context, clickAction) {
        context.commit('SET_SETTINGS_LINK_CLICK_ACTION', clickAction);

        return saveSettingsToDb(context);
    },

    /**
     * Updates patreon link click action setting.
     *
     * @param {Object} context Store context.
     * @param {string} clickAction New click action.
     * @returns {Promise<void>}
     */
    updatePatreonClickAction (context, clickAction) {
        context.commit('SET_SETTINGS_PATREON_CLICK_ACTION', clickAction);

        return saveSettingsToDb(context);
    },

    /**
     * Updates patreon link visibility settings.
     *
     * @param {Object} context Store context.
     * @param {string} visibility New visibility value.
     */
    updatePatreonLinkVisibility (context, visibility) {
        context.commit('SET_SETTINGS_PATREON_LINK_VISIBILITY', visibility);

        return saveSettingsToDb(context);
    },

    /**
     * Updates www link visibility settings.
     *
     * @param {Object} context Store context.
     * @param {string} visibility New visibility value.
     */
    updateWwwLinkVisibility (context, visibility) {
        context.commit('SET_SETTINGS_WWW_LINK_VISIBILITY', visibility);

        return saveSettingsToDb(context);
    },

    /**
     * Updates F95 link visibility settings.
     *
     * @param {Object} context Store context.
     * @param {string} visibility New visibility value.
     */
    updateF95LinkVisibility (context, visibility) {
        context.commit('SET_SETTINGS_F95_LINK_VISIBILITY', visibility);

        return saveSettingsToDb(context);
    },

    /**
     * Updates F95 link visibility settings.
     *
     * @param {Object} context Store context.
     * @param {string} visibility New visibility value.
     */
    updateItchLinkVisibility (context, visibility) {
        context.commit('SET_SETTINGS_ITCH_LINK_VISIBILITY', visibility);

        return saveSettingsToDb(context);
    },

    /**
     * Removes tag from the database.
     *
     * @param {Object} context Store context.
     * @param {string} tag Tag to remove.
     * @returns {Promise<boolean>}
     */
    async deleteTag (context, tag) {
        await itemRepository.deleteTag(tag);
        await tagsRepository.remove(tag);

        context.commit('DELETE_TAG', tag);

        return true;
    },
};

const getters = {
    /**
     * Returns path to database file
     *
     * @param {Object} state State object.
     * @returns {string}
     */
    dbFile (state) {
        return state.dbFile;
    },

    /**
     * Returns name of the database.
     *
     * @param {Object} state State object.
     * @returns {string}
     */
    dbName (state) {
        return path.basename(state.dbFile);
    },

    /**
     * Returns password for the database.
     *
     * @param {Object} state State object.
     * @returns {string}
     */
    dbPassword (state) {
        return state.dbPassword;
    },

    /**
     * Returns all tags available.
     *
     * @param {Object} state State object.
     * @returns {string[]}
     */
    tags (state) {
        return state.tags;
    },

    /**
     * Returns all categories available.
     *
     * @param {Object} state State object.
     * @returns {{name: string, color: string, dark: boolean, _id: string}}
     */
    categories (state) {
        return state.categories;
    },

    /**
     * Returns settings object.
     *
     * @param {Object} state State object.
     * @returns {{imageQuality: number}}
     */
    settings (state) {
        return state.settings;
    }
};

Vue.use(Vuex);

export default new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    strict: true,
});