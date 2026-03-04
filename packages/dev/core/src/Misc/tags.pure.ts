/** This file must only contain pure code and pure imports */

import { AndOrNotEvaluator } from "./andOrNotEvaluator";

/**
 * Class used to store custom tags
 */
export class Tags {}

/**
 * Adds support for tags on the given object
 * @param obj defines the object to use
 */
export function TagsEnableFor(obj: any): void {
    obj._tags = obj._tags || {};

    obj.hasTags = () => {
        return TagsHasTags(obj);
    };

    obj.addTags = (tagsString: string) => {
        return TagsAddTagsTo(obj, tagsString);
    };

    obj.removeTags = (tagsString: string) => {
        return TagsRemoveTagsFrom(obj, tagsString);
    };

    obj.matchesTagsQuery = (tagsQuery: string) => {
        return TagsMatchesQuery(obj, tagsQuery);
    };
}

/**
 * Removes tags support
 * @param obj defines the object to use
 */
export function TagsDisableFor(obj: any): void {
    delete obj._tags;
    delete obj.hasTags;
    delete obj.addTags;
    delete obj.removeTags;
    delete obj.matchesTagsQuery;
}

/**
 * Gets a boolean indicating if the given object has tags
 * @param obj defines the object to use
 * @returns a boolean
 */
export function TagsHasTags(obj: any): boolean {
    if (!obj._tags) {
        return false;
    }

    const tags = obj._tags;
    for (const i in tags) {
        if (Object.prototype.hasOwnProperty.call(tags, i)) {
            return true;
        }
    }
    return false;
}

/**
 * Gets the tags available on a given object
 * @param obj defines the object to use
 * @param asString defines if the tags must be returned as a string instead of an array of strings
 * @returns the tags
 */
export function TagsGetTags(obj: any, asString: boolean = true): any {
    if (!obj._tags) {
        return null;
    }
    if (asString) {
        const tagsArray = [];
        for (const tag in obj._tags) {
            if (Object.prototype.hasOwnProperty.call(obj._tags, tag) && obj._tags[tag] === true) {
                tagsArray.push(tag);
            }
        }
        return tagsArray.join(" ");
    } else {
        return obj._tags;
    }
}

/**
 * Adds tags to an object
 * @param obj defines the object to use
 * @param tagsString defines the tag string. The tags 'true' and 'false' are reserved and cannot be used as tags.
 * A tag cannot start with '||', '&&', and '!'. It cannot contain whitespaces
 */
export function TagsAddTagsTo(obj: any, tagsString: string): void {
    if (!tagsString) {
        return;
    }

    if (typeof tagsString !== "string") {
        return;
    }

    const tags = tagsString.split(" ");
    for (const tag of tags) {
        Tags_AddTagTo(obj, tag);
    }
}

/**
 * @internal
 */
export function Tags_AddTagTo(obj: any, tag: string): void {
    tag = tag.trim();

    if (tag === "" || tag === "true" || tag === "false") {
        return;
    }

    if (tag.match(/[\s]/) || tag.match(/^([!]|([|]|[&]){2})/)) {
        return;
    }

    TagsEnableFor(obj);
    obj._tags[tag] = true;
}

/**
 * Removes specific tags from a specific object
 * @param obj defines the object to use
 * @param tagsString defines the tags to remove
 */
export function TagsRemoveTagsFrom(obj: any, tagsString: string) {
    if (!TagsHasTags(obj)) {
        return;
    }
    const tags = tagsString.split(" ");
    for (const t in tags) {
        Tags_RemoveTagFrom(obj, tags[t]);
    }
}

/**
 * @internal
 */
export function Tags_RemoveTagFrom(obj: any, tag: string): void {
    delete obj._tags[tag];
}

/**
 * Defines if tags hosted on an object match a given query
 * @param obj defines the object to use
 * @param tagsQuery defines the tag query
 * @returns a boolean
 */
export function TagsMatchesQuery(obj: any, tagsQuery: string): boolean {
    if (tagsQuery === undefined) {
        return true;
    }

    if (tagsQuery === "") {
        return TagsHasTags(obj);
    }

    return AndOrNotEvaluator.Eval(tagsQuery, (r) => TagsHasTags(obj) && obj._tags[r]);
}
