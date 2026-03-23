export {};

declare module "../../Engines/abstractEngine" {
    /**
     *
     */
    export interface AbstractEngine {
        /** @internal */
        _debugPushGroup(groupName: string): void;

        /** @internal */
        _debugPopGroup(): void;

        /** @internal */
        _debugInsertMarker(text: string): void;
    }
}
