import databaseManager from '../lib/DatabaseManager.js';

export default {
    /**
     * Inserts new document into items repository.
     *
     * @param {Object} itemData Data to insert into items repository.
     * @returns {Promise<Object, Error>}
     */
    insert (itemData) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().insert(itemData, (err, item) => {
                if (err) {
                    reject(err);
                    return null;
                } else {
                    resolve(item);
                    return item;
                }
            });
        });
    },

    /**
     * Updates document in database.
     *
     * @param {string} id Documents ID.
     * @param {Object} itemData Documents data.
     * @returns {Promise<any, Error>}
     */
    update (id, itemData) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().update({_id: id}, { $set: itemData }, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Counts total number of items in the database.
     *
     * @param {Object} filters Filtry ograniczające w wyświetlanie pozycji na liście.
     * @returns {Promise<number, Error>}
     */
    countTotal (filters) {
        const params = this._buildQueryParams(filters);

        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().count(params, function (err, total) {
                if (err) {
                    reject(err);
                } else {
                    resolve(total);
                }
            });
        });
    },

    /**
     * Returns items list based on search criteria.
     *
     * @param {number} start Start.
     * @param {number} limit Limit.
     * @param {Object} filters Filter data to filter out the list.
     * @param {{field: string, order: string}|null} sort Sorting order for the list.
     * @returns {Promise<Array, Error>}
     */
    find (start, limit, filters, sort = null) {
        const params = this._buildQueryParams(filters);

        return new Promise((resolve, reject) => {
            let query = databaseManager.getItemsDb().find(params);

            if (sort) {
                query.sort(this._buildSortParams(sort));
            }

            query.skip(start).limit(limit);

            query.exec(function (err, items) {
                if (err) {
                    reject(err);
                } else {
                    resolve(items);
                }
            });
        });
    },

    /**
     * Finds items by its patreon link.
     *
     * @param {string} patreon
     * @returns {Promise<Array, Error>}
     */
    findByPatreon (patreon) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().find({patreon}, (err, items) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(items);
                }
            });
        });
    },

    /**
     * Updates category data in all items that are assigned to this category.
     *
     * @param {string} categoryId Category ID.
     * @param {{color: string, name: string, dark: boolean}} categoryData Category data to replace.
     * @returns {Promise<any>}
     */
    updateCategory (categoryId, categoryData) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().update(
                {'category.id' : categoryId},
                {$set: {'category.name' : categoryData.name, 'category.color' : categoryData.color, 'category.dark' : categoryData.dark}},
                { multi: true },
                err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    },

    /**
     * Deletes category from all items in the database.
     *
     * @param {string} categoryId Category ID to be deleted.
     * @returns {Promise<any>}
     */
    deleteCategory (categoryId) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().update(
                {'category.id': categoryId},
                {$set: { category : null }},
                { multi: true },
                err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            )
        });
    },

    /**
     * Removes item from the database.
     *
     * @param {string} id ID of the item to be removed.
     * @returns {Promise<any>}
     */
    remove (id) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().remove({'_id' : id}, {}, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Deletes tag from all items containing.
     *
     * @param {string} tag Tag to delete.
     * @returns {Promise<any>}
     */
    deleteTag (tag) {
        return new Promise((resolve, reject) => {
            databaseManager.getItemsDb().update(
                {tags: tag},
                {$pull : { tags: tag }},
                { multi: true },
                err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    },

    /**
     * Builds NeDB query filters based on provided params.
     *
     * @param {Object} filters Filters.
     * @returns {Object}
     * @private
     */
    _buildQueryParams (filters) {
        let params = {archived: filters.archived};

        if (filters.category) {
            if (filters.category === '*uncategorized*') {
                params['category'] = null;
            } else {
                params['category.id'] = filters.category;
            }
        }

        if (typeof filters.favorites !== 'undefined') {
            params.favorite = filters.favorites;
        }

        if (filters.name) {
            params.name = { $regex : new RegExp(filters.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
        }

        if (typeof filters.inDevelopment !== 'undefined') {
            params.inDevelopment = filters.inDevelopment;
        }

        if (typeof filters.completed !== 'undefined') {
            params.completed = filters.completed;
        }

        if (typeof filters.rating !== 'undefined') {
            params.rating = { $gte : filters.rating };
        }

        if (filters.tags.length) {
            params = { $and : [ params ] };

            for (let tag of filters.tags) {
                params.$and.push({tags: tag});
            }
        }

        return params;
    },

    /**
     * Builds NeDB sorting based on provided params.
     *
     * @param {Object} sort Sorting params.
     * @private
     */
    _buildSortParams (sort) {
        let sortParams = {};

        sortParams[sort.field] = sort.order === 'asc' ? 1 : -1;

        return sortParams;
    }
}