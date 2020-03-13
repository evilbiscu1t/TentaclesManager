<template>
    <v-dialog v-model="isVisible">
        <v-card>
            <v-toolbar dark color="primary">
                <v-toolbar-title>{{ title }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon dark @click="hide">
                    <v-icon>close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-layout align-center>
                <v-item-group v-model="window" class="shrink mr-4" mandatory tag="v-flex">
                    <v-item v-for="n in screenshots.length" :key="n">
                        <div slot-scope="{ active, toggle }">
                            <v-btn :input-value="active" icon @click="toggle">
                                <v-icon>fiber_manual_record</v-icon>
                            </v-btn>
                        </div>
                    </v-item>
                </v-item-group>

                <v-flex>
                    <v-window v-model="window" class="elevation-1" vertical>
                        <v-window-item v-for="(screen, i) in screenshots" :key="i">
                            <v-card flat>
                                <v-img :src="screen" :height="windowHeight - 200" contain />
                            </v-card>
                        </v-window-item>
                    </v-window>
                </v-flex>
            </v-layout>
        </v-card>
    </v-dialog>
</template>

<script>
    import {remote} from 'electron';

    export default {
        name: 'ScreenshotsDialog',

        data () {
            return {
                isVisible : false,

                title : '',

                screenshots: [],

                window: 0,

                windowHeight : 200,
            };
        },

        methods : {
            show (title, screenshots) {
                const size = remote.getCurrentWindow().getSize();

                this.windowHeight = size[1];

                this.title = title;
                this.screenshots = screenshots;
                this.isVisible = true;
                this.window = 0;
            },

            hide () {
                this.isVisible = false;
                this.title = '';
                this.screenshots = [];
            }
        }
    };
</script>

<style scoped>

</style>