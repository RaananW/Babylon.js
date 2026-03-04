import { ActionEvent, ActionEventCreateNew, ActionEventCreateNewFromSprite, ActionEventCreateNewFromScene, ActionEventCreateNewFromPrimitive } from "./actionEvent.pure";

declare module "./actionEvent.pure" {
    namespace ActionEvent {
        export let CreateNew: typeof ActionEventCreateNew;
        export let CreateNewFromSprite: typeof ActionEventCreateNewFromSprite;
        export let CreateNewFromScene: typeof ActionEventCreateNewFromScene;
        export let CreateNewFromPrimitive: typeof ActionEventCreateNewFromPrimitive;
    }
}
ActionEvent.CreateNew = ActionEventCreateNew;
ActionEvent.CreateNewFromSprite = ActionEventCreateNewFromSprite;
ActionEvent.CreateNewFromScene = ActionEventCreateNewFromScene;
ActionEvent.CreateNewFromPrimitive = ActionEventCreateNewFromPrimitive;

export * from "./actionEvent.pure";
