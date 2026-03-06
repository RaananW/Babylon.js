/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fileTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fileTools.pure";

import { LoadFile, LoadImage, ReadFile, RequestFile, _injectLTSFileTools } from "./fileTools.pure";


initSideEffects();


_injectLTSFileTools(DecodeBase64UrlToBinary, DecodeBase64UrlToString, FileToolsOptions, IsBase64DataUrl, IsFileURL, LoadFile, LoadImage, ReadFile, RequestFile, SetCorsBehavior);
