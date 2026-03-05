import { SceneSerializer, SceneSerializerClearCache, SceneSerializerSerialize, SceneSerializerSerializeAsync, SceneSerializerSerializeMesh } from "./sceneSerializer.pure";

declare module "./sceneSerializer.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace SceneSerializer {
        export { SceneSerializerClearCache as ClearCache };
        export { SceneSerializerSerialize as Serialize };
        export { SceneSerializerSerializeAsync as SerializeAsync };
        export { SceneSerializerSerializeMesh as SerializeMesh };
    }
}

SceneSerializer.ClearCache = SceneSerializerClearCache;
SceneSerializer.Serialize = SceneSerializerSerialize;
SceneSerializer.SerializeAsync = SceneSerializerSerializeAsync;
SceneSerializer.SerializeMesh = SceneSerializerSerializeMesh;

export * from "./sceneSerializer.pure";
