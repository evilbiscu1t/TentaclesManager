import { Menu, app } from 'electron';

import menuText from './application-menu-text.js';
import { openWelcomeWindow } from './index.js';

export default function () {
    let text;
    if (typeof menuText[app.getLocale()] !== 'undefined') {
        text = menuText[app.getLocale()];
    } else {
        text = menuText['en'];
    }

    const template = [
        {
            label   : text['file'],
            submenu : [
                {
                    label : text['openCreate'],
                    click () {
                        openWelcomeWindow();
                    }
                }
            ]
        },
        {
            label   : text['edit'],
            submenu : [
                {
                    label       : text['undo'],
                    accelerator : 'CommandOrControl+Z',
                    role        : 'undo',
                },
                {
                    label       : text['redo'],
                    accelerator : 'Shift+CommandOrControl+Z',
                    role        : 'redo',
                },
                {type: 'separator'},
                {
                    label       : text['cut'],
                    accelerator : 'CommandOrControl+X',
                    role        : 'cut',
                },
                {
                    label       : text['copy'],
                    accelerator : 'CommandOrControl+C',
                    role        : 'copy',
                },
                {
                    label       : text['paste'],
                    accelerator : 'CommandOrControl+V',
                    role        : 'paste',
                },
                {
                    label       : text['selectAll'],
                    accelerator : 'CommandOrControl+A',
                    role        : 'selectall',
                }
            ]
        },
        {
            label   : text['window'],
            role    : 'window',
            submenu : [
                {
                    label       : text['minimize'],
                    accelerator : 'CommandOrControl+M',
                    role        : 'minimize',
                },
                {
                    label       : text['close'],
                    accelerator : 'CommandOrControl+W',
                    role        : 'close',
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        const name = 'Tentacles Manager';

        template.unshift({
            label   : name,
            submenu : [
                {
                    label       : text['hide'],
                    accelerator : 'Command+H',
                    role        : 'hide',
                },
                {
                    label       : text['hideOthers'],
                    accelerator : 'Command+Alt+H',
                    role        : 'hideothers',
                },
                {
                    label       : text['showAll'],
                    role        : 'unhide',
                },
                {type: 'separator'},
                {
                    label       : text['quit'],
                    accelerator : 'Command+Q',
                    click () {
                        app.quit();
                    }
                }
            ]
        });

        const windowMenu = template.find(item => item.role === 'window');
        windowMenu.submenu.push(
            {type: 'separator'},
            {
                label       : text['allToFront'],
                role        : 'front',
            }
        );
    }

    return Menu.buildFromTemplate(template);
}