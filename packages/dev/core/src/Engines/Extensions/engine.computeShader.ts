/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.computeShader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.computeShader.pure";

import { ComputeBindingList, ComputeBindingMapping } from "./engine.computeShader.pure";
import { ThinEngine } from "../../Engines/thinEngine";
import { AbstractEngine } from "../abstractEngine";
import type { ComputeEffect, IComputeEffectCreationOptions, IComputeShaderPath } from "../../Compute/computeEffect";
import type { IComputeContext } from "../../Compute/IComputeContext";
import type { IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import type { Nullable } from "../../types";
import type { DataBuffer } from "../../Buffers/dataBuffer";


ThinEngine.prototype.createComputeEffect = function (baseName: IComputeShaderPath & { computeToken?: string }, options: IComputeEffectCreationOptions): ComputeEffect {
    throw new Error("createComputeEffect: This engine does not support compute shaders!");
};


ThinEngine.prototype.createComputePipelineContext = function (): IComputePipelineContext {
    throw new Error("createComputePipelineContext: This engine does not support compute shaders!");
};


ThinEngine.prototype.createComputeContext = function (): IComputeContext | undefined {
    return undefined;
};


ThinEngine.prototype.computeDispatch = function (
    effect: ComputeEffect,
    context: IComputeContext,
    bindings: ComputeBindingList,
    x: number,
    y?: number,
    z?: number,
    bindingsMapping?: ComputeBindingMapping
): void {
    throw new Error("computeDispatch: This engine does not support compute shaders!");
};

ThinEngine.prototype.computeDispatchIndirect = function (
    effect: ComputeEffect,
    context: IComputeContext,
    bindings: ComputeBindingList,
    buffer: DataBuffer,
    offset?: number,
    bindingsMapping?: ComputeBindingMapping
): void {
    throw new Error("computeDispatchIndirect: This engine does not support compute shaders!");
};


ThinEngine.prototype.areAllComputeEffectsReady = function (): boolean {
    return true;
};


ThinEngine.prototype.releaseComputeEffects = function (): void {};


ThinEngine.prototype._prepareComputePipelineContext = function (
    pipelineContext: IComputePipelineContext,
    computeSourceCode: string,
    rawComputeSourceCode: string,
    defines: Nullable<string>,
    entryPoint: string
): void {};


ThinEngine.prototype._rebuildComputeEffects = function (): void {};


AbstractEngine.prototype._executeWhenComputeStateIsCompiled = function (
    pipelineContext: IComputePipelineContext,
    action: (messages: Nullable<ComputeCompilationMessages>) => void
): void {
    action(null);
};


ThinEngine.prototype._releaseComputeEffect = function (effect: ComputeEffect): void {};


ThinEngine.prototype._deleteComputePipelineContext = function (pipelineContext: IComputePipelineContext): void {};
