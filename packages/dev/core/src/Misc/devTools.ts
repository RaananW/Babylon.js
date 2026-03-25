const WarnedMap: { [key: string]: boolean } = {};
/**
 * @internal
 */
export function _WarnImport(name: string, warnOnce = false) {
    if (warnOnce && WarnedMap[name]) {
        return;
    }
    WarnedMap[name] = true;
    return `${name} needs to be imported before as it contains a side-effect required by your code.`;
}

const _StubWarnedMap: { [key: string]: boolean } = {};

/**
 * Returns a stub function that logs a warning when an augmented method is called
 * without importing its side-effect module. The real implementation overwrites
 * the stub when the corresponding register function is loaded.
 * @internal
 */
export function _MissingSideEffect(className: string, methodName: string): (...args: unknown[]) => void {
    return function () {
        const key = `${className}.${methodName}`;
        if (!_StubWarnedMap[key]) {
            _StubWarnedMap[key] = true;
            // eslint-disable-next-line no-console
            console.warn(`[Babylon.js] ${key}() requires a side-effect import. See: https://doc.babylonjs.com/setup/treeshaking`);
        }
    };
}

/**
 * Returns a property descriptor that logs a warning when an augmented property is
 * accessed without importing its side-effect module.
 * @internal
 */
export function _MissingSideEffectProperty(className: string, propName: string): PropertyDescriptor {
    return {
        get() {
            const key = `${className}.${propName}`;
            if (!_StubWarnedMap[key]) {
                _StubWarnedMap[key] = true;
                // eslint-disable-next-line no-console
                console.warn(`[Babylon.js] ${key} requires a side-effect import. See: https://doc.babylonjs.com/setup/treeshaking`);
            }
            return undefined;
        },
        set(_value) {
            // Allow setting without warning — the real augmentation will define the proper setter
        },
        configurable: true,
        enumerable: true,
    };
}
