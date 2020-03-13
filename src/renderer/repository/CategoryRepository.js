import databaseManager from '../lib/DatabaseManager.js';

export default {
    /**
     * Adds category to the database.
     *
     * @param {Object} category Category to add.
     * @returns {Promise<{name: string, color: string, dark: boolean, _id: string}>}
     */
    addCategory(category) {
        return new Promise((resolve, reject) => {
            databaseManager.getCategoryDb().insert(category, (err, dbCategory) => {
                if (err) {
                    reject(err);
                    return null;
                } else {
                    resolve(dbCategory);
                    return dbCategory;
                }
            });
        });
    },

    /**
     * Select all categories from the database ordered by name.
     *
     * @returns {Promise<{name: string, color: string, dark: boolean, _id: string}[]>}
     */
    findAll() {
        return new Promise((resolve, reject) => {
            databaseManager.getCategoryDb().find({}).sort({name: 1}).exec((err, categories) => {
                if (err) {
                    reject(err);
                    return null;
                } else {
                    resolve(categories);
                    return categories;
                }
            });
        });
    },

    /**
     * Updates category data in the database.
     *
     * @param {string} id Category ID.
     * @param {string} name Category name.
     * @param {string} color Category color.
     * @param {boolean} dark ID category color dark.
     * @returns {Promise<any>}
     */
    update (id, name, color, dark) {
        return new Promise((resolve, reject) => {
            databaseManager.getCategoryDb().update({_id : id}, {$set : {name, color, dark}}, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Removes category for the given ID from the database.
     *
     * @param {string} id Category ID.
     * @returns {Promise<any>}
     */
    remove (id) {
        return new Promise((resolve, reject) => {
            databaseManager.getCategoryDb().remove({_id: id}, {}, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};