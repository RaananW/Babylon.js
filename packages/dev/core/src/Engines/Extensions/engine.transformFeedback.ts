/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.transformFeedback.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.transformFeedback.pure";

import { Nullable } from "../../types";
import { DataBuffer } from "../../Buffers/dataBuffer";
import { Engine } from "../../Engines/engine";

Engine.prototype.createTransformFeedback = function (): WebGLTransformFeedback {
    const transformFeedback = this._gl.createTransformFeedback();
    if (!transformFeedback) {
        throw new Error("Unable to create Transform Feedback");
    }
    return transformFeedback;
};

Engine.prototype.deleteTransformFeedback = function (value: WebGLTransformFeedback): void {
    this._gl.deleteTransformFeedback(value);
};

Engine.prototype.bindTransformFeedback = function (value: Nullable<WebGLTransformFeedback>): void {
    this._gl.bindTransformFeedback(this._gl.TRANSFORM_FEEDBACK, value);
};

Engine.prototype.beginTransformFeedback = function (usePoints: boolean = true): void {
    this._gl.beginTransformFeedback(usePoints ? this._gl.POINTS : this._gl.TRIANGLES);
};

Engine.prototype.endTransformFeedback = function (): void {
    this._gl.endTransformFeedback();
};

Engine.prototype.setTranformFeedbackVaryings = function (program: WebGLProgram, value: string[]): void {
    this._gl.transformFeedbackVaryings(program, value, this._gl.INTERLEAVED_ATTRIBS);
};

Engine.prototype.bindTransformFeedbackBuffer = function (value: Nullable<DataBuffer>): void {
    this._gl.bindBufferBase(this._gl.TRANSFORM_FEEDBACK_BUFFER, 0, value ? value.underlyingResource : null);
};

Engine.prototype.readTransformFeedbackBuffer = function (target: ArrayBufferView): void {
    this._gl.getBufferSubData(this._gl.TRANSFORM_FEEDBACK_BUFFER, 0, target);
};
