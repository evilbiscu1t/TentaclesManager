<template>
    <v-dialog persistent width="500" v-model="show">
        <v-card>
            <v-card-text>
                <v-layout>
                    <v-flex xs4>
                        <v-progress-circular :rotate="360" :size="100" :width="15" :value="progress" color="primary">
                            {{ progress }}
                        </v-progress-circular>
                    </v-flex>
                    <v-flex xs9>
                        <div v-if="progress !== 100">
                            <div class="headline">{{ $t('dialog.updatingVersionInfo') }}</div>
                            <div class="body-2">{{ $t('updating') }}: {{ currentGameTitle }}</div>
                        </div>
                        <div v-else>
                            <div class="headline">{{ $t('dialog.updateComplete') }}</div>
                            <div class="body-2" v-if="progress === 100">{{ $t('dialog.updateCompleteInfo', {updated: updatedVersions, total: totalDownloads}) }}</div>
                        </div>
                    </v-flex>
                </v-layout>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="red" @click="cancel" dark v-show="progress !== 100" :disabled="cancelDownload">
                    <v-icon left dark>cancel</v-icon>
                    {{ $t('cancel') }}
                </v-btn>
                <v-btn color="primary" @click="close" dark v-show="progress === 100">
                    <v-icon left dark>close</v-icon>
                    {{ $t('close') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import { remote } from 'electron';

    import itemRepository from '../repository/ItemRepository.js';

    const mainProcess = remote.require('./main.js');

    export default {
        name: "DownloadVersionsDialog",

        data () {
            return {
                show : false,
                cancelDownload : false,
                progress : 0,
                currentGameTitle : '',
                totalDownloads : 0,
                updatedVersions : 0,
            }
        },

        methods : {
            cancel () {
                this.cancelDownload = true;
            },

            close () {
                this.show = false;
                this.progress = 0;
                this.cancelDownload = false;
                this.currentGameTitle = '';
                this.totalDownloads = 0;
                this.updatedVersions = 0;
            },

            start () {
                this.show = true;

                itemRepository.findAllForVersionUpdate().then(itemsToUpdate => {
                    const total = itemsToUpdate.length;

                    (async () => {
                        let toUpdate = [];

                        for (let i = 0; i < total; i++) {
                            if (this.cancelDownload) {
                                break;
                            }

                            let item = itemsToUpdate[i];

                            await itemRepository.update(item._id, {updated: false});

                            this.currentGameTitle = item.name;
                            this.progress         = Math.floor((i / total) * 100);

                            const downloadedVersion = await mainProcess.downloadF95VersionPromise(item.f95);

                            this.totalDownloads++;
                            if (downloadedVersion && downloadedVersion !== item.currentVersion) {
                                this.updatedVersions++;

                                toUpdate.push({id: item._id, version: downloadedVersion});
                            }
                        }

                        if (this.cancelDownload) {
                            this.close();
                        } else {
                            // display download result
                            this.currentGameTitle = this.$t('dialog.savingData');

                            for (let data of toUpdate) {
                                await itemRepository.update(data.id, {currentVersion: data.version, updated: true});
                            }

                            this.progress = 100;

                            this.$emit('update-complete');
                        }
                    })();
                });
            }
        }
    }
</script>

<style scoped>

</style>