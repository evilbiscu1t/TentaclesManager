import fetch from "node-fetch";
import domparser from "html-dom-parser";

/**
 * Version for the function to download F95 version that returns promise.
 *
 * @param {string} topicPath Path to the topic.
 * @return {Promise<string>}
 */
export function downloadF95VersionPromise(topicPath) {
    return new Promise(((resolve) => {
        downloadF95Version(topicPath, version => {
            resolve(version);
        });
    }));
}

/**
 * Function that parses only topic title and extracts version number from it to save a little of processing power when
 * other metadata is not needed.
 *
 * @param {string} topicPath Path to the topic.
 * @param {function} callback Callback function that is called after download is completed.
 */
export function downloadF95Version(topicPath, callback) {
    fetch('https://f95zone.to/threads/' + topicPath)
        .then(res => res.text())
        .then(body => {
            let match = body.match(/<h1 class="p-title-value">(.|\s)+?<\/h1>/m);

            if (match) {
                const titleDom = domparser(match[0]);
                let titleText  = '';
                let version = false;

                if (titleDom && titleDom.length) {
                    for (let elem of titleDom[0].children) {
                        if (elem.type === 'text') {
                            titleText = elem.data;
                        }
                    }
                }

                let versionMatch = titleText.match(/\[(.+?)\]/);
                if (versionMatch) {
                    callback(versionMatch[1]);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        }).catch(() => callback(false));
}

/**
 * Downloads metadata from F95 topic.
 *
 * @param {string} topicPath Path to the topic.
 * @param {function} callback Callback to call after data is parsed.
 */
export function downloadF95Metadata(topicPath, callback) {
    fetch('https://f95zone.to/threads/' + topicPath)
        .then(res => res.text())
        .then(body => {
            let match     = body.match(/<li class="groupedTags">(.|\s)+?<\/li>/m);
            let tagsList  = [];
            let title     = '';
            let completed = false;
            let version   = '';

            if (match) {
                const tagsDom = domparser(match[0]);

                if (tagsDom && tagsDom.length) {
                    for (let tag of tagsDom[0].children) {
                        if (tag.name === 'a') {
                            if (tag.children && tag.children.length && tag.children[0].type === 'text') {
                                tagsList.push(tag.children[0].data);
                            }
                        }
                    }
                }
            }

            match = body.match(/<h1 class="p-title-value">(.|\s)+?<\/h1>/m);

            if (match) {
                const titleDom = domparser(match[0]);
                let titleText  = '';

                if (titleDom && titleDom.length) {
                    for (let elem of titleDom[0].children) {
                        if (elem.type === 'text') {
                            titleText = elem.data;
                        } else if (elem.name === 'a') {
                            if (elem.children && elem.children.length) {
                                if (elem.children[0].name === 'span' && elem.children[0].children && elem.children[0].children.length) {
                                    if (elem.children[0].children[0].type === 'text' && elem.children[0].children[0].data.toLowerCase() === '[completed]') {
                                        completed = true;
                                    }
                                }
                            }
                        }
                    }
                }

                let versionMatch = titleText.match(/\[(.+?)\]/);
                if (versionMatch) {
                    version = versionMatch[1];
                }

                if (titleText.indexOf('[') > 0) {
                    titleText = titleText.substring(0, titleText.indexOf('['));
                }

                title = titleText.trim();
            }

            callback({
                title,
                version,
                tags : tagsList,
                completed,
            });
        });
}

/**
 * Downloads metadata from Subscribe Star.
 *
 * @param {string} path Path to Subscribe Star profile.
 * @param {function} callback Callback function.
 */
export function downloadSubscribeStarMetadata(path, callback) {
    fetch('https://subscribestar.adult/' + path)
        .then(res => res.text())
        .then(body => {
            let avatar      = '';
            let description = '';
            let tagsList    = [];

            let match = body.match(/<img\sdata-view="app#avatar"\sdata-type="avatar".+?\s\/>/);

            if (match) {
                const avatarDom = domparser(match[0]);
                avatar = avatarDom[0].attribs.src;
            }

            match = body.match(/<div\sclass="profile_main_info-categories"><div\sclass="profile_categories for-profile_main_info">[^\0]+?<\/div><\/div><\/div>/);

            if (match) {
                const tagsDom = domparser(match[0]);

                for (let categoryDiv of tagsDom[0].children[0].children) {
                    if (categoryDiv.name === 'div' && categoryDiv.children[0].name === 'a') {
                        console.log(categoryDiv.children[0].children[0].data);
                        tagsList.push(categoryDiv.children[0].children[0].data);
                    }
                }
            }

            match = body.match(/<div\sclass="profile_main_info-description">([^\0]+?)<\/div>/);

            if (match) {
                description = match[1];
            }

            callback({
                avatar,
                description,
                tags : tagsList
            });
        });
}