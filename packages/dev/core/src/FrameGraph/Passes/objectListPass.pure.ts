import type { Nullable, AbstractEngine, IFrameGraphPass, FrameGraphContext, FrameGraphObjectList, FrameGraphTask } from "core/index";
import { FrameGraphPass } from "./pass";

/**
 * Object list pass used to generate a list of objects.
 */

export * from "./objectListPass.types";
export class FrameGraphObjectListPass extends FrameGraphPass<FrameGraphContext> {
    protected readonly _engine: AbstractEngine;
    protected _objectList: FrameGraphObjectList;

    /**
     * Gets the object list used by the pass.
     */
    public get objectList(): FrameGraphObjectList {
        return this._objectList;
    }

    /**
     * Sets the object list to use for the pass.
     * @param objectList The object list to use for the pass.
     */
    public setObjectList(objectList: FrameGraphObjectList) {
        this._objectList = objectList;
    }

    /** @internal */
    constructor(name: string, parentTask: FrameGraphTask, context: FrameGraphContext, engine: AbstractEngine) {
        super(name, parentTask, context);
        this._engine = engine;
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._objectList !== undefined ? null : "Object list is not set (call setObjectList to set it)";
    }
}

/**
 * Checks if a pass is an object list pass.
 * @param pass The pass to check.
 * @returns True if the pass is an object list pass, else false.
 */
export function FrameGraphObjectListPassIsObjectListPass(pass: IFrameGraphPass): pass is FrameGraphObjectListPass {
    return (pass as FrameGraphObjectListPass).setObjectList !== undefined;
}

let _registered = false;

/**
 * Register side effects for objectListPass.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerObjectListPass(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    FrameGraphObjectListPass.IsObjectListPass = FrameGraphObjectListPassIsObjectListPass;
}
