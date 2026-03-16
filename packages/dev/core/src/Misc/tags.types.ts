export {};

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
