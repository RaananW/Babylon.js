/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basis.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basis.pure";


Object.defineProperty(BasisTools, "JSModuleURL", {
    get: function (this: null) {
        return BasisToolsOptions.JSModuleURL;
    },
    set: function (this: null, value: string) {
        BasisToolsOptions.JSModuleURL = value;
    },
});


Object.defineProperty(BasisTools, "WasmModuleURL", {
    get: function (this: null) {
        return BasisToolsOptions.WasmModuleURL;
    },
    set: function (this: null, value: string) {
        BasisToolsOptions.WasmModuleURL = value;
    },
});
