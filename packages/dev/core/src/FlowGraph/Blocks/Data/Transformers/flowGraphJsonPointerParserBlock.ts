/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphJsonPointerParserBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphJsonPointerParserBlock.pure";

import { FlowGraphJsonPointerParserBlock } from "./flowGraphJsonPointerParserBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.JsonPointerParser, FlowGraphJsonPointerParserBlock);
