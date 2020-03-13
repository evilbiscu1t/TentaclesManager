<template>
    <v-card>
        <v-card-title>
            <span class="headline">{{ $t('filters') }}</span>
        </v-card-title>
        <v-card-text>
            <v-text-field :label="$t('item.name')" class="mx-2" v-model="filterData.name"></v-text-field>
            <v-select :label="$t('item.inDevelopment')" :items="inDevelopmentValues" clearable class="mx-2" v-model="filterData.inDevelopment"></v-select>
            <v-select :label="$t('item.completed')" :items="completedValues" clearable class="mx-2" v-model="filterData.completed"></v-select>
            <v-select :label="$t('item.rating')" :items="ratingValues" clearable class="mx-2" v-model="filterData.rating"></v-select>
            <v-select :items="tags" chips :label="$t('item.tags')" multiple class="mx-2" v-model="filterData.tags"></v-select>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn flat @click="clearFilters">{{ $t('filter.btn.reset') }}</v-btn>
            <v-btn color="primary" flat @click="applyFilters">{{ $t('filter.btn.filter') }}</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'FiltersPanel',

        props : ['value'],

        data () {
            return {
                inDevelopmentValues : [
                    {value: true, text : this.$t('filter.inDev.showInDev')},
                    {value: false, text : this.$t('filter.inDev.showNotInDev')}
                ],

                completedValues : [
                    {value: true, text : this.$t('filter.completed.showCompleted')},
                    {value: false, text : this.$t('filter.completed.showNotCompleted')}
                ],

                ratingValues : [
                    {value: 2, text : this.$t('filter.rating.above2')},
                    {value: 3, text : this.$t('filter.rating.above3')},
                    {value: 4, text : this.$t('filter.rating.above4')},
                    {value: 5, text : this.$t('filter.rating.above5')}
                ],

                filterData : {
                    name : '',
                    inDevelopment : undefined,
                    completed : undefined,
                    rating : undefined,
                    tags : []
                },
            };
        },

        computed : mapGetters(['tags']),

        methods : {
            applyFilters() {
                this.$emit('filters-changed', this.filterData);
                this.$emit('input', this._isFilterDefined());
            },

            clearFilters() {
                this.filterData.name = '';
                this.filterData.inDevelopment = undefined;
                this.filterData.completed = undefined;
                this.filterData.rating = undefined;
                this.filterData.tags = [];

                this.$emit('filters-changed', this.filterData);
                this.$emit('input', this._isFilterDefined());
            },

            /**
             * Determines if filters are defined in form.
             *
             * @returns {boolean}
             * @private
             */
            _isFilterDefined() {
                return this.filterData.name !== '' || (typeof this.filterData.inDevelopment !== 'undefined') ||
                    (typeof this.filterData.rating !== 'undefined') || this.filterData.tags.length ||
                    (typeof this.filterData.completed !== 'undefined');
            }
        },
    };
</script>

<style scoped>

</style>