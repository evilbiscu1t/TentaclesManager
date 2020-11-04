import 'vuetify/dist/vuetify.min.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import './style.css';

import './plugins/vuetify.js';
import {i18n} from './plugins/i18n.js';
import './plugins/vuetify-image-input.js';

import Vue from 'vue';
import querystring from 'querystring';

import store from './store/store.js';
import WelcomeWindow from './window/WelcomeWindow.vue';
import NewDatabaseWindow from './window/NewDatabaseWindow.vue';
import MainWindow from './window/MainWindow.vue';
import DatabaseFixerWindow from "./window/DatabaseFixerWindow";

const params = querystring.parse(global.location.search.substr(1));
let   windowComponent;

switch (params.target) {
    case 'newDatabaseWindow':
        windowComponent = NewDatabaseWindow;
        break;
    case 'mainWindow':
        windowComponent = MainWindow;
        store.dispatch('setDbFile', params.dbFile);
        break;
    case 'databaseFixerWindow':
        windowComponent = DatabaseFixerWindow;
        store.dispatch('setDbFile', params.dbFile);
        break;
    default:
        windowComponent = WelcomeWindow;
        break;
}

new Vue({
    el: '#app',
    i18n,
    store,
    data: {},
    render: h => h(windowComponent),
});