export {};

declare module "./actionEvent.pure" {
    namespace ActionEvent {
        export let CreateNew: typeof ActionEventCreateNew;
        export let CreateNewFromSprite: typeof ActionEventCreateNewFromSprite;
        export let CreateNewFromScene: typeof ActionEventCreateNewFromScene;
        export let CreateNewFromPrimitive: typeof ActionEventCreateNewFromPrimitive;
    }
}
