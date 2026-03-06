/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fileTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fileTools.pure";

import {
    DecodeBase64UrlToBinary,
    DecodeBase64UrlToString,
    FileToolsOptions,
    IsBase64DataUrl,
    IsFileURL,
    LoadFile,
    LoadImage,
    ReadFile,
    RequestFile,
    SetCorsBehavior,
    _injectLTSFileTools,
} from "./fileTools.pure";
import { _FunctionContainer } from "../Engines/Processors/shaderProcessor";
import { EngineFunctionContext } from "core/Engines/abstractEngine.functions";
import { AbstractEngine } from "../Engines/abstractEngine";

const initSideEffects = () => {
    AbstractEngine._FileToolsLoadImage = LoadImage;
    EngineFunctionContext.loadFile = LoadFile;
    _FunctionContainer.loadFile = LoadFile;
};

initSideEffects();

_injectLTSFileTools(DecodeBase64UrlToBinary, DecodeBase64UrlToString, FileToolsOptions, IsBase64DataUrl, IsFileURL, LoadFile, LoadImage, ReadFile, RequestFile, SetCorsBehavior);
