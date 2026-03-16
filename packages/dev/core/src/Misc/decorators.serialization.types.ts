export {};

declare module "./decorators.serialization.pure" {
    namespace SerializationHelper {
        export let AppendSerializedAnimations: typeof SerializationHelperAppendSerializedAnimations;
        export let Serialize: typeof SerializationHelperSerialize;
        export let ParseProperties: typeof SerializationHelperParseProperties;
        export let Parse: typeof SerializationHelperParse;
        export let Clone: typeof SerializationHelperClone;
        export let Instanciate: typeof SerializationHelperInstanciate;
    }
}
