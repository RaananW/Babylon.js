export * from "./decorators.serialization.pure";
import {
    SerializationHelper,
    SerializationHelperAppendSerializedAnimations,
    SerializationHelperSerialize,
    SerializationHelperParseProperties,
    SerializationHelperParse,
    SerializationHelperClone,
    SerializationHelperInstanciate,
} from "./decorators.serialization.pure";

declare module "./decorators.serialization.pure" {
    // eslint-disable-next-line no-shadow
    namespace SerializationHelper {
        export let AppendSerializedAnimations: typeof SerializationHelperAppendSerializedAnimations;
        export let Serialize: typeof SerializationHelperSerialize;
        export let ParseProperties: typeof SerializationHelperParseProperties;
        export let Parse: typeof SerializationHelperParse;
        export let Clone: typeof SerializationHelperClone;
        export let Instanciate: typeof SerializationHelperInstanciate;
    }
}

SerializationHelper.AppendSerializedAnimations = SerializationHelperAppendSerializedAnimations;
SerializationHelper.Serialize = SerializationHelperSerialize;
SerializationHelper.ParseProperties = SerializationHelperParseProperties;
SerializationHelper.Parse = SerializationHelperParse;
SerializationHelper.Clone = SerializationHelperClone;
SerializationHelper.Instanciate = SerializationHelperInstanciate;
