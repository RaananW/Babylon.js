/**
 * Re-exports all pure tags types and attaches static methods at runtime.
 * Import tags.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tags.pure";

import {
    Tags,
    TagsEnableFor,
    TagsDisableFor,
    TagsHasTags,
    TagsGetTags,
    TagsAddTagsTo,
    Tags_AddTagTo,
    TagsRemoveTagsFrom,
    Tags_RemoveTagFrom,
    TagsMatchesQuery,
} from "./tags.pure";

declare module "./tags.pure" {
    namespace Tags {
        export let EnableFor: typeof TagsEnableFor;
        export let DisableFor: typeof TagsDisableFor;
        export let HasTags: typeof TagsHasTags;
        export let GetTags: typeof TagsGetTags;
        export let AddTagsTo: typeof TagsAddTagsTo;
        export let _AddTagTo: typeof Tags_AddTagTo;
        export let RemoveTagsFrom: typeof TagsRemoveTagsFrom;
        export let _RemoveTagFrom: typeof Tags_RemoveTagFrom;
        export let MatchesQuery: typeof TagsMatchesQuery;
    }
}

Tags.EnableFor = TagsEnableFor;
Tags.DisableFor = TagsDisableFor;
Tags.HasTags = TagsHasTags;
Tags.GetTags = TagsGetTags;
Tags.AddTagsTo = TagsAddTagsTo;
Tags._AddTagTo = Tags_AddTagTo;
Tags.RemoveTagsFrom = TagsRemoveTagsFrom;
Tags._RemoveTagFrom = Tags_RemoveTagFrom;
Tags.MatchesQuery = TagsMatchesQuery;
