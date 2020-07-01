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