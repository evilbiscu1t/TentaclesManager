import databaseManager from '../lib/DatabaseManager.js';

export default {
    /**
     * Add tags to the database.
     *
     * @param {string[]} tags Tags to add.
     * @returns {Promise<any>}
     */
    addTags (tags) {
        return new Promise((resolve, reject) => {
            if (!tags.length) {
                resolve([]);
            }

            let tagsToAdd = [];
            for (let tag of tags) {
                tagsToAdd.push({tag});
            }

            databaseManager.getTagsDb().insert(tagsToAdd, (err, items) => {
                if (err) {
                    reject(err);
                    return null;
                } else {
                    resolve(items);
                    return items;
                }
            });
        });
    },

    /**
     * Removes tag from the database.
     *
     * @param {string} tag Tag to remove.
     * @returns {Promise<any>}
     */
    remove (tag) {
        return new Promise((resolve, reject) => {
            databaseManager.getTagsDb().remove({tag}, {}, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Returns all tags in the database.
     *
     * @returns {Promise<[{tag: string}]>}
     */
    findAll () {
        return new Promise((resolve, reject) => {
            databaseManager.getTagsDb().find({}, (err, tags) => {
                if (err) {
                    reject(err);
                    return null;
                } else {
                    resolve(tags);
                    return tags;
                }
            });
        });
    }
}