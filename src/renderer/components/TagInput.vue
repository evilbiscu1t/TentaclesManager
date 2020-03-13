<template>
    <div></div>
</template>

<script>
    import Tagify from '@yaireo/tagify';
    import '@yaireo/tagify/dist/tagify.css';

    export default {
        name  : 'TagInput',

        data () {
            return {
                tags : [],

                tagify : null,
            };
        },

        mounted() {
            const tagify = new Tagify(this.$el, {
                whitelist : this.$store.getters.tags,
            });

            tagify.on('add', e => {
                if (this.tags.indexOf(e.detail.data.value) === -1) {
                    this.tags.push(e.detail.data.value);
                }
            }).on('remove', e => {
                const index = this.tags.indexOf(e.detail.data.value);

                if (index > -1) {
                    this.tags.splice(index, 1);
                }
            });

            this.tagify = tagify;
        },

        methods : {
            setTags (tags) {
                this.tags = tags;

                this.tagify.removeAllTags();

                if (tags.length) {
                    this.tagify.addTags(tags);
                }
            },

            getTags () {
                return this.tags;
            }
        }
    };
</script>

<style>
    .tagify--focus {
        border-color: #673AB7 !important;
    }

    .tagify {
        border-color: #9E9E9E;
        font-family: Roboto, sans-serif !important;
    }

    .tagify__dropdown {
        border-color: #9E9E9E !important;
        font-family: Roboto, sans-serif !important;
    }

    .tagify__tag-text {
        font-family: Roboto, sans-serif !important;
    }
</style>