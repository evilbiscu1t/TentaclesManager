import fs from 'fs-extra';
import path from 'path';

import store from '../store/store.js';
import itemRepository from '../repository/ItemRepository.js';

/**
 * Operation responsible for removing item from the database.
 */
export default class {
    constructor (id) {
        this.id = id;
    }

    async execute () {
        const dataPath = path.join(store.getters.dbFile, 'data', this.id);

        await fs.remove(dataPath);
        await itemRepository.remove(this.id);
    }
};