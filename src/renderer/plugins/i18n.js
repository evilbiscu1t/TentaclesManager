import Vue from 'vue';
import VueI18n from 'vue-i18n';
import {remote} from 'electron';

import en from '../locale/messages.en.js';
import pl from '../locale/messages.pl.js';

Vue.use(VueI18n);

export const i18n = new VueI18n({
    locale         : remote.app.getLocale(),
    fallbackLocale : 'en',
    messages       : {en, pl}

});