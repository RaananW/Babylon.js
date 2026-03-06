/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tags.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tags.pure";

import { Tags, TagsAddTagsTo, TagsDisableFor, TagsEnableFor, TagsGetTags, TagsHasTags, TagsMatchesQuery, TagsRemoveTagsFrom, Tags_AddTagTo, Tags_RemoveTagFrom } from "./tags.pure";

Tags.EnableFor = TagsEnableFor;

Tags.DisableFor = TagsDisableFor;

Tags.HasTags = TagsHasTags;

Tags.GetTags = TagsGetTags;

Tags.AddTagsTo = TagsAddTagsTo;

Tags._AddTagTo = Tags_AddTagTo;

Tags.RemoveTagsFrom = TagsRemoveTagsFrom;

Tags._RemoveTagFrom = Tags_RemoveTagFrom;

Tags.MatchesQuery = TagsMatchesQuery;
