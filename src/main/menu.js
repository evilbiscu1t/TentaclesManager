import { remote } from 'electron';

import { i18n } from '../renderer/plugins/i18n.js';

let stdTextMenu = null;

export function standardTextMenu() {
    if (!stdTextMenu) {
        stdTextMenu = remote.Menu.buildFromTemplate([
            {
                label : i18n.t('cut'),
                role  : 'cut',
            },
            {
                label : i18n.t('copy'),
                role  : 'copy'
            },
            {
                label : i18n.t('paste'),
                role  : 'paste'
            },
            {type: 'separator'},
            {
                label : i18n.t('selectAll'),
                role  : 'selectall'
            }
        ]);
    }

    return stdTextMenu;
}