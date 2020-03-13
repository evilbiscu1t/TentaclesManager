<template>
    <v-card>
        <v-card-title>
            <span class="headline">{{ $t('orderBy') }}</span>
        </v-card-title>
        <v-card-text>
            <v-select :label="$t('sort.field')" :items="sortFields" class="mx-2" ref="fieldField" v-model="value.field" @input="updateOrder"></v-select>
            <v-select :label="$t('sort.direction')" :items="sortOrder" class="mx-2" ref="orderField" v-model="value.order" @input="updateOrder"></v-select>
        </v-card-text>
    </v-card>
</template>

<script>
    export default {
        name: 'SortPanel',

        props : ['value'],

        data () {
            return {
                sortFields : [
                    {value: 'name', text: this.$t('item.name')},
                    {value: 'rating', text: this.$t('item.rating')}
                ],

                sortOrder : [
                    {value: 'asc', text: this.$t('sort.order.asc')},
                    {value: 'desc', text: this.$t('sort.order.desc')}
                ],
            };
        },

        methods : {
            updateOrder () {
                this.$emit('input', {
                    field : this.value.field,
                    order : this.value.order,
                });
            }
        }
    };
</script>

<style scoped>

</style>