export {};

declare module "./sceneSerializer.pure" {
    namespace SceneSerializer {
        export { SceneSerializerClearCache as ClearCache };
        export { SceneSerializerSerialize as Serialize };
        export { SceneSerializerSerializeAsync as SerializeAsync };
        export { SceneSerializerSerializeMesh as SerializeMesh };
    }
}
