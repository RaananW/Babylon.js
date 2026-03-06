/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphTypeToTypeBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphTypeToTypeBlocks.pure";

import {
    FlowGraphBooleanToFloat,
    FlowGraphBooleanToInt,
    FlowGraphFloatToBoolean,
    FlowGraphFloatToInt,
    FlowGraphIntToBoolean,
    FlowGraphIntToFloat,
} from "./flowGraphTypeToTypeBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.BooleanToFloat, FlowGraphBooleanToFloat);

RegisterClass(FlowGraphBlockNames.BooleanToInt, FlowGraphBooleanToInt);

RegisterClass(FlowGraphBlockNames.FloatToBoolean, FlowGraphFloatToBoolean);

RegisterClass(FlowGraphBlockNames.IntToBoolean, FlowGraphIntToBoolean);

RegisterClass(FlowGraphBlockNames.IntToFloat, FlowGraphIntToFloat);

RegisterClass(FlowGraphBlockNames.FloatToInt, FlowGraphFloatToInt);
