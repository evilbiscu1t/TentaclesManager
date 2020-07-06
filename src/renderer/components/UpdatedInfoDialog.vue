<template>
    <v-dialog persistent width="500" v-model="show">
        <v-card>
            <v-card-title primary-title>
                <div>
                    <h3 class="headline mb-3">About this tab</h3>
                    <div style="text-align: justify">This tab is used to track new releases of games in the database. To work correctly you will need to add at least one game that has link to its topic on F95Zone forum. Once you have games in your library with correct links just click the updated button <v-icon>sync</v-icon> in the top right corner to start the search for the new versions. The app will download information from the forum about current games version. If the current version is different from the one stored in your database the game will be displayed on the list below. The game will remain on the list until next scan for updates.</div>
                </div>
            </v-card-title>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="close">
                    <v-icon left dark>close</v-icon>
                    {{ $t('close') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    export default {
        name: "InfoDialog",

        data () {
            return {
                show : false,

                title : '',

                message : '',
            };
        },

        methods : {
            showInfo () {
                this.show = true;
            },

            close () {
                this.show = false;
            },
        }
    }
</script>

<style scoped>

</style>