# Tree-Shaking Improvement Plan — `@babylonjs/core`

## Current State

| Metric                                         | Count                                       |
| ---------------------------------------------- | ------------------------------------------- |
| Total source files in `packages/dev/core/src/` | ~2,215                                      |
| Files calling `RegisterClass()`                | ~427                                        |
| Files with prototype augmentation              | ~88 (367 assignments)                       |
| Files writing to `ShaderStore`                 | ~164                                        |
| Files calling `Node.AddNodeConstructor()`      | ~25                                         |
| Existing `.pure.ts` files                      | **1** (`materialHelper.functions.pure.ts`)  |
| Current `sideEffects` in package.json          | `["**/*"]` (everything, except `ThinMaths`) |

---

## Phase 0 — Auditing & Tooling Foundation

- [x] **0.1** — Build a side-effect inventory script (`scripts/treeshaking/auditSideEffects.mjs`)
    - Scans all `.ts` files in `packages/dev/core/src/`
    - Detects: `RegisterClass()`, `*.prototype.* = ...`, `ShaderStore.*Store[...] = ...`, `Node.AddNodeConstructor(...)`, bare top-level calls, static property assignments, `declare module` augmentations
    - Outputs JSON manifest (`scripts/treeshaking/side-effects-manifest.json`)
    - Run: `npm run audit:side-effects`
    - **Results** (as of audit run):
        - 2,209 files scanned
        - **913 files** with side effects, **1,296 files** already pure
        - 406 files have **only** `RegisterClass` (easiest to convert)
        - See breakdown below
- [x] **0.2** — Validate with bundle smoke test (`scripts/treeshaking/bundleSmokeTest.mjs`)
    - Rollup + Webpack test entries that import ThinMaths (the only side-effect-free subtree)
    - Run: `npm run test:treeshaking`
    - **Results**: Both Rollup (1 byte) and Webpack (0 bytes) produce empty bundles for bare ThinMaths import ✓

### Audit Results Breakdown

| Side-Effect Type             | Occurrences | Unique Files |
| ---------------------------- | ----------- | ------------ |
| `RegisterClass`              | 535         | 426          |
| `prototype-assignment`       | 344         | 84           |
| `shader-store-write`         | 331         | 331          |
| `declare-module`             | 108         | 91           |
| `static-property-assignment` | 66          | 59           |
| `AddNodeConstructor`         | 26          | 25           |
| `top-level-call`             | 9           | 8            |

### Files by Side-Effect Complexity

| Category                       | Count | Conversion Difficulty                   |
| ------------------------------ | ----- | --------------------------------------- |
| Already pure (no side effects) | 1,296 | None needed                             |
| Only `RegisterClass`           | 406   | Easy — mechanical split                 |
| Shader store writes            | 331   | Leave as-is (inherently side-effectful) |
| Prototype augmentations        | 84    | Already separate files in most cases    |
| Static property assignments    | 59    | Medium — need factory pattern           |
| Multiple mixed side effects    | ~37   | Case-by-case                            |

- [x] **1.1** — Annotate module-scope `new`, factory calls, `Object.freeze()` etc. in pure-candidate files
    - Added `/*#__PURE__*/` annotations to **5 `.pure.ts` source files** (44 sites total):
        - `Maths/math.color.pure.ts` — 7 sites (2× `Object.defineProperties`, 2× `_V8PerformanceHack`, 1× `_BlackReadOnly`, 2× `BuildArray`)
        - `Maths/math.vector.pure.ts` — 31 sites (5× `Object.defineProperties`, 4× `_V8PerformanceHack`, 13× `_ReadOnly`, 8× `BuildTuple`, 1× `Matrix.FromValues`)
        - `scene.pure.ts` — 2 sites (2× top-level `new Vector4()`)
        - `Particles/…/createParticleBlock.pure.ts` — 1 site (`new Color4()`)
        - `Particles/…/updateAttractorBlock.pure.ts` — 3 sites (3× `Vector3.Zero()`)
    - **Key finding**: TypeScript preserves `/*#__PURE__*/` for top-level `const`/`let` and `Object.defineProperties`, but **strips annotations from static class field initializers** (hoisted outside the class body)
    - Solution: post-build injection script `scripts/treeshaking/injectPureAnnotations.mjs`
        - Scans all `.pure.js` files in `dist/`, injects `/*#__PURE__*/` before call expressions in top-level `ClassName.field = ...` assignments
        - Idempotent (safe to run multiple times), supports `--dry-run` and `--verbose`
        - Run: `npm run inject:pure-annotations`
    - **After tsc + injection**: all 44 annotations present in compiled `.js` output ✓
    - Bundle smoke tests: all 12 pass ✓
- [x] **1.2** — Add lint/CI check for missing annotations in side-effect-free files
    - New ESLint rule: `babylonjs/require-pure-annotation` (in `eslintBabylonPlugin`)
    - Fires for `.pure.ts` files only
    - Checks: static field initializers, top-level variable initializers, top-level expression statements
    - Auto-fixable (inserts `/*#__PURE__*/` before the call expression)
    - Unwraps `TSAsExpression` / `TSTypeAssertion` wrappers
    - Enabled as `"error"` in `eslint.config.mjs` for `packages/dev/core/src/**/*.pure.ts`

## Phase 2 — Split Files into `FILE.pure.ts` + `FILE.ts`

- [x] **2.1** — Define `.pure.ts` convention and document it
    - Convention: `FILE.pure.ts` contains all code except `RegisterClass` calls and their import
    - `FILE.ts` becomes thin wrapper: `export * from "./FILE.pure"` + RegisterClass calls
    - Pure files have header: `/** This file must only contain pure code and pure imports */`
    - `Object.defineProperties` stays in pure file (semantically tied to class definitions)
- [x] **2.2** — Pilot: Maths/ directory (manual split of `math.color.ts` and `math.vector.ts`)
    - Created `math.color.pure.ts` (1,913 lines) + `math.color.ts` wrapper (12 lines)
    - Created `math.vector.pure.ts` (8,877 lines) + `math.vector.ts` wrapper (14 lines)
    - Created `math.pure.ts` and `pure.ts` barrel files for side-effect-free imports
    - All smoke tests pass (bare import → 0-1 bytes, named import → bundles correctly)
- [x] **2.3** — Automation script: `scripts/treeshaking/splitRegisterClass.mjs`
    - Handles string literals (`"BABYLON.Xxx"`) and variable refs (`FlowGraphBlockNames.Xxx`)
    - Handles `GetClass` + `RegisterClass` co-imports (preserves GetClass in pure file)
    - Result: **397 files split automatically** + 2 manual = **399 total**
    - **7 edge cases deferred** — script regex only matches `"…"` strings and bare identifiers; 6 files use backtick template literals, 1 file defines `RegisterClass` itself
    - TypeScript compilation: ✅ zero errors
    - Bundle smoke tests: ✅ all pass
- [ ] **2.4** — Handle 7 deferred edge cases manually
    - **Root cause A — Backtick template literal in `RegisterClass()` call** (6 files):
        1. `Materials/GreasedLine/greasedLinePluginMaterial.ts` — uses interpolation: ``RegisterClass(`BABYLON.${GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME}`, …)``
        2. `PostProcesses/RenderPipeline/Pipelines/taaMaterialManager.ts` — also has a second class (`TAAMaterialManager`) defined _after_ the call
        3. `Rendering/GlobalIllumination/giRSMManager.ts`
        4. `Rendering/IBLShadows/iblShadowsPluginMaterial.ts`
        5. `Rendering/reflectiveShadowMap.ts`
        6. `XR/features/WebXRDepthSensing.ts` — also has a second class (`WebXRDepthSensing`) defined _after_ the call
    - **Root cause B — File _defines_ `RegisterClass`** (1 file): 7. `Misc/typeStore.ts` — exports the `RegisterClass` function itself; no import to detect
    - **Fix options**: (a) extend regex on line 122 of `splitRegisterClass.mjs` to match backtick template literals, then re-run; (b) split these 7 files by hand
- [ ] **2.5** — Shaders remain as-is (inherently side-effectful), explicitly listed in `sideEffects`

### Post-Phase-2 Audit Stats

| Metric                     | Before | After |
| -------------------------- | ------ | ----- |
| Total `.ts` files          | 2,209  | 2,610 |
| Files WITHOUT side effects | 1,296  | 1,697 |
| New `.pure.ts` files       | 1      | 401   |

## Phase 3 — Introduce `pure.ts` Barrel Files

- [x] **3.1** — Add `pure.ts` sibling to every subdirectory `index.ts`
    - Automation script: `scripts/treeshaking/generatePureBarrels.mjs`
    - Reads side-effects manifest + scans for `.pure.ts` files
    - For each `export * from "./file"` in `index.ts`:
        - If `file.pure.ts` exists → rewrite to `export * from "./file.pure"`
        - If file is already pure (not in manifest) → keep as-is
        - If file has side effects and no `.pure.ts` → skip
    - For `import "./file"` (bare side-effect imports) → skip
    - For subdirectory references → recursively generate `pure.ts` there
    - Handles macOS case-insensitive FS (file-first disambiguation for `./abstractEngine` vs `./AbstractEngine/`)
    - Run: `npm run generate:pure-barrels`
    - **Results**:
        - **112 `pure.ts` barrel files** generated (+ 1 root = 113 total)
        - 399 exports rewritten to `.pure` specifiers
        - 841 exports kept as-is (already pure files)
        - 26 bare side-effect imports skipped
        - 319 exports skipped (remaining impure files: shader writes, `AddNodeConstructor`, prototype augmentations, etc.)
        - 6 directories entirely side-effectful (empty barrel — not written): `Engines/AbstractEngine`, `Engines/Extensions`, `Engines/WebGPU/Extensions`, `Engines/Native/Extensions`, `Lights/Clustered`, `Probes`
- [x] **3.2** — Root-level `packages/dev/core/src/pure.ts`
    - 47 exports (all top-level directories + pure top-level files like `scene.pure`, `sceneComponent`, `types`)
    - Compiles to `dist/pure.js` and public `@babylonjs/core/pure.js` + `pure.d.ts`
- [x] **3.3** — Public package access: `@babylonjs/core/pure`
    - No `exports` field change needed — the public package has no `exports` field (uses direct file access)
    - The compiled `pure.js` + `pure.d.ts` files are auto-generated in the public package output
    - Consumers can import: `import { Vector3 } from "@babylonjs/core/Maths/pure"` or `import { ... } from "@babylonjs/core/pure"`
    - TypeScript compilation: ✅ zero errors
    - Bundle smoke tests: ✅ all 20 pass (10 test cases × 2 bundlers)
    - Key result: `import "@babylonjs/core/pure"` → **0–1 bytes** (Rollup/Webpack)

### Smoke Test Results (Phase 3)

| Test                                | Rollup   | Webpack   |
| ----------------------------------- | -------- | --------- |
| ThinMaths bare import               | 1 byte ✓ | 0 bytes ✓ |
| ThinMaths named import              | 120 B ✓  | 143 B ✓   |
| math.color.pure bare                | 1 byte ✓ | 0 bytes ✓ |
| math.color.pure named (Color3)      | 62 KB ✓  | 12 KB ✓   |
| math.vector.pure bare               | 1 byte ✓ | 0 bytes ✓ |
| math.pure barrel bare               | 1 byte ✓ | 0 bytes ✓ |
| **Maths/pure barrel bare**          | 1 byte ✓ | 0 bytes ✓ |
| **Cameras/pure barrel bare**        | 1 byte ✓ | 0 bytes ✓ |
| **Root pure barrel bare**           | 1 byte ✓ | 0 bytes ✓ |
| **Root pure barrel named (Color3)** | 93 B ✓   | 12 KB ✓   |

## Phase 4 — Factor Out Static Helpers

- [x] **4.1** — Identify static methods that can become module-level functions
    - Cataloged **292 public static methods** and **38 static properties** across 9 priority classes
    - Automation script: `scripts/treeshaking/catalogStaticHelpers.mjs`
    - Run: `npm run catalog:static-helpers` (add `--verbose` for per-function lists)
    - **Strategy**: Create parallel free functions using `I*Like` interfaces (not replace class statics)
        - Free functions use public `.x`/`.y`/`.z` (structural types) — no class dependency
        - Class statics remain unchanged (backward compatible, no performance regression)
        - One-way dependency: class file → functions file (no circular imports)
        - Tree-shaking benefit: users can import individual functions without pulling entire class
    - **Key finding**: The codebase already had `math.vector.functions.ts` with 17 functions + `math.scalar.functions.ts` + `ThinMaths/thinMath.matrix.functions.ts` (10 functions) — an established pattern
- [x] **4.2** — Expand free functions for priority classes
    - **`Maths/math.vector.functions.ts`** — expanded from 17 → **38 functions**
        - New Vector2: `AddToRef`, `SubtractToRef`, `LengthSquared`, `Length`, `Dot`
        - New Vector3: `AddToRef`, `MultiplyToRef`, `NegateToRef`, `CrossToRef`, `MinimizeToRef`, `MaximizeToRef`, `ClampToRef`, `CheckExtends`, `Hermite1stDerivativeToRef`, `HermiteToRef`, `EqualsWithEpsilon`
        - New Vector4: `AddToRef`, `SubtractToRef`, `ScaleToRef`, `NormalizeToRef`, `LerpToRef`
    - **`Maths/math.color.functions.ts`** — **NEW**, 9 functions
        - Color3: `LerpToRef`, `HSVtoRGBToRef`, `ToLinearSpaceToRef`, `ToGammaSpaceToRef`, `EqualsWithEpsilon`
        - Color4: `LerpToRef`, `ToLinearSpaceToRef`, `ToGammaSpaceToRef`, `EqualsWithEpsilon`
    - **`Maths/math.quaternion.functions.ts`** — **NEW**, 11 functions
        - `Dot`, `LengthSquared`, `Length`, `NormalizeToRef`, `InverseToRef`, `AreClose`, `SlerpToRef`, `RotationAxisToRef`, `FromEulerAnglesToRef`, `RotationYawPitchRollToRef`, `MultiplyToRef`
    - All new files re-exported from `Maths/index.ts` and `Maths/pure.ts` barrels
    - Coverage: **85 / 292** static methods have free-function equivalents (**29.1%**)
    - Bundler configs updated: `.functions.js` pattern added to side-effect-free rules
    - TypeScript compilation: ✅ zero errors
    - Bundle smoke tests: ✅ all 32 pass (16 test cases × 2 bundlers)

### Phase 4 Smoke Test Results

| Test                                                | Rollup    | Webpack   |
| --------------------------------------------------- | --------- | --------- |
| vector-functions bare                               | 1 byte ✓  | 0 bytes ✓ |
| vector-functions named (`Vector3CrossToRef`)        | 826 B ✓   | 142 B ✓   |
| color-functions bare                                | 1 byte ✓  | 0 bytes ✓ |
| quaternion-functions bare                           | 1 byte ✓  | 0 bytes ✓ |
| quaternion-functions named (`QuaternionSlerpToRef`) | 1,460 B ✓ | 323 B ✓   |
| pure-barrel named function (`Vector3CrossToRef`)    | 120 B ✓   | 142 B ✓   |

### Static Helper Coverage

| Class      | Static Methods | Free Functions | Coverage  |
| ---------- | -------------- | -------------- | --------- |
| Vector2    | 28             | 7              | 25%       |
| Vector3    | 59             | 25             | 42%       |
| Vector4    | 27             | 8              | 30%       |
| Quaternion | 47             | 11             | 23%       |
| Matrix     | 62             | 10 (ThinMaths) | 16%       |
| Color3     | 22             | 5              | 23%       |
| Color4     | 11             | 4              | 36%       |
| Animation  | 8              | 0              | 0%        |
| Mesh       | 28             | 0              | 0%        |
| **Total**  | **292**        | **85**         | **29.1%** |

> **Note**: Not all static methods benefit from extraction. Factory methods (e.g., `Vector3.Zero()`,
> `Matrix.Identity()`) construct class instances and thus inherently depend on the class.
> The `*ToRef` pattern and scalar-returning functions are the best extraction candidates.
> Animation/Mesh statics are lower priority — Animation mostly has constants (enum-like),
> and Mesh has deprecated `Create*` stubs.

### Phase 4.3 — Extract Static Methods from Classes into Standalone Functions

Phase 4.1–4.2 created _parallel_ free functions alongside class statics using `I*Like` interfaces.
Phase 4.3 takes a more aggressive approach: **remove** the static methods from the class entirely,
define them as standalone `export function ClassName_MethodName(...)` after the class in `.pure.ts`,
then re-attach at runtime via `declare module` augmentation + assignment in `.ts`.

**Pattern** (using Color3.FromArray as example):

```ts
// In .pure.ts — standalone function after the class:
export function Color3FromArray(array: ArrayLike<number>, offset = 0): Color3 {
    return new Color3(array[offset], array[offset + 1], array[offset + 2]);
}

// In .ts — augmentation + runtime assignment:
declare module "./math.color.pure" {
    namespace Color3 {
        export let FromArray: typeof Color3FromArray;
    }
}
Color3.FromArray = Color3FromArray;
```

**Rules**:

- Methods accessing **private fields** stay as class statics (partial extraction)
- Static **getters** stay in the class (cannot be standalone functions)
- When a name collides with an existing `.functions.ts` export, the `.pure.ts` version is **non-exported**
  and the `.ts` wrapper imports from `.functions.ts` instead
- Cross-references: `ClassName.ExtractedMethod(` → `ClassNameExtractedMethod(` within `.pure.ts`
- `this.Method(` in statics → `ClassNameMethod(` (for extracted) or `ClassName.Method(` (for staying)

#### Tracking Table

| File                                                              |  Methods | .pure.ts | Status                                                               |
| ----------------------------------------------------------------- | -------: | :------: | -------------------------------------------------------------------- |
| `Maths/math.vector.pure.ts`                                       |      177 |    ✓     | ✅ Done (Vector2/3/4, Quaternion, Matrix)                            |
| `Maths/math.color.pure.ts`                                        |       33 |    ✓     | ✅ Done (Color3: 22, Color4: 11)                                     |
| `Misc/tools.ts`                                                   |       46 | ✓ (new)  | ✅ Done (46 extracted, 11 kept)                                      |
| `Meshes/mesh.pure.ts`                                             |       28 |    ✓     | ✅ Done (28 extracted, 2 kept internally)                            |
| `Misc/PerformanceViewer/performanceViewerCollectionStrategies.ts` |       26 | ✓ (new)  | ✅ Done (26 extracted)                                               |
| `Meshes/mesh.vertexData.ts`                                       |       23 | ✓ (new)  | ✅ Done                                                              |
| `Misc/greasedLineTools.ts`                                        |       23 | ✓ (new)  | ✅ Done                                                              |
| `Engines/WebGPU/webgpuTextureHelper.ts`                           |       15 | ✓ (new)  | ✅ Done (15 extracted)                                               |
| `Loading/sceneLoader.ts`                                          |       14 |    ✗     | ⏭ Skip (private module functions)                                   |
| `Animations/animation.ts`                                         |        9 | ✓ (new)  | ✅ Done                                                              |
| `Misc/trajectoryClassifier.ts`                                    |       11 |    ✗     | ⏭ Skip (only 2 of 11 clean)                                         |
| `Maths/math.path.ts`                                              |       11 | ✓ (new)  | ✅ Done                                                              |
| `Animations/animationGroup.ts`                                    |       10 |    ✗     | ⏭ Skip (private instance fields)                                    |
| `Misc/tags.ts`                                                    |        9 | ✓ (new)  | ✅ Done                                                              |
| `Maths/math.frustum.ts`                                           |        9 | ✓ (new)  | ✅ Done                                                              |
| `Misc/dataStorage.ts`                                             |        8 |    ✗     | ⏭ Skip (private `_Storage`)                                         |
| `Materials/Textures/rawTexture.ts`                                |        8 |    ✗     | ✅ Done                                                              |
| `XR/motionController/webXRMotionControllerManager.ts`             |        8 |    ✗     | ⏭ Skip (6 of 8 use private registries)                              |
| `Materials/materialHelper.geometryrendering.ts`                   |        7 |    ✗     | ⏭ Skip (private `_Configurations`)                                  |
| `Misc/decorators.serialization.ts`                                |        6 |    ✗     | ✅ Done                                                              |
| `Culling/ray.core.ts`                                             |        6 |    ✗     | ✅ Done                                                              |
| `XR/webXRFeaturesManager.ts`                                      |        6 |    ✗     | ⏭ Skip (all readonly constants)                                     |
| `Meshes/abstractMesh.pure.ts`                                     |        6 |    ✓     | ⏭ Skip (all readonly constants)                                     |
| `Maths/math.polar.ts`                                             |        6 | ✓ (new)  | ✅ Done                                                              |
| `Buffers/buffer.ts`                                               |        5 |    ✗     | ✅ Done                                                              |
| `Materials/Node/nodeMaterial.pure.ts`                             |        4 |    ✓     | ✅ Done                                                              |
| `Particles/particleHelper.ts`                                     |        5 |    ✗     | ✅ Done                                                              |
| `Actions/actionEvent.ts`                                          |        4 | ✓ (new)  | ✅ Done                                                              |
| `Maths/math.size.ts`                                              |        2 | ✓ (new)  | ✅ Done                                                              |
| `Engines/shaderStore.ts`                                          |        3 | ✓ (new)  | ✅ Done                                                              |
| `Maths/sphericalPolynomial.ts`                                    |        4 | ✓ (new)  | ✅ Done (SphericalHarmonics: 2, SphericalPolynomial: 2)              |
| `Culling/boundingBox.ts`                                          |        3 | ✓ (new)  | ✅ Done (3 extracted, 1 kept: IntersectsSphere)                      |
| `Misc/sceneOptimizer.ts`                                          |        4 | ✓ (new)  | ✅ Done (SceneOptimizerOptions: 3, SceneOptimizer: 1)                |
| `Materials/prePassConfiguration.ts`                               |        2 | ✓ (new)  | ✅ Done (AddUniforms, AddSamplers)                                   |
| `FrameGraph/Node/nodeRenderGraphBlockConnectionPoint.ts`          |        3 | ✓ (new)  | ✅ Done                                                              |
| `Sprites/spriteManager.ts`                                        |        3 | ✓ (new)  | ✅ Done (Parse, ParseFromFileAsync, ParseFromSnippetAsync)           |
| `Meshes/Node/nodeGeometry.ts`                                     |        3 | ✓ (new)  | ✅ Done (CreateDefault, Parse, ParseFromSnippetAsync)                |
| `Particles/Node/nodeParticleSystemSet.ts`                         |        4 | ✓ (new)  | ✅ Done (CreateDefault, Parse, ParseFromFile/SnippetAsync)           |
| `node.ts`                                                         |        1 | ✓ (new)  | ✅ Done (ParseAnimationRanges)                                       |
| `Misc/khronosTextureContainer2.ts`                                |        1 | ✓ (new)  | ✅ Done (IsValid)                                                    |
| `Culling/boundingSphere.ts`                                       |        1 | ✓ (new)  | ✅ Done (Intersects; CreateFromCenterAndRadius blocked)              |
| `FrameGraph/Node/nodeRenderGraph.ts`                              |        3 | ✓ (new)  | ✅ Done (CreateDefaultAsync, Parse, ParseFromSnippetAsync)           |
| `Misc/rgbdTextureTools.ts`                                        |        2 | ✓ (new)  | ✅ Done (ExpandRGBDTexture, EncodeTextureToRGBD)                     |
| `Misc/dds.ts`                                                     |        1 | ✓ (new)  | ✅ Done (GetDDSInfo; UploadDDSLevels blocked)                        |
| `Misc/timingTools.ts`                                             |        1 | ✓ (new)  | ✅ Done (SetImmediate)                                               |
| `Misc/retryStrategy.ts`                                           |        1 | ✓ (new)  | ✅ Done (ExponentialBackoff)                                         |
| `Misc/gradients.ts`                                               |        1 | ✓ (new)  | ✅ Done (GetCurrentGradient)                                         |
| `Misc/deepCopier.ts`                                              |        1 | ✓ (new)  | ✅ Done (DeepCopy)                                                   |
| `Misc/asyncLock.ts`                                               |        1 | ✓ (new)  | ✅ Done (LockAsync)                                                  |
| `Misc/videoRecorder.ts`                                           |        1 | ✓ (new)  | ✅ Done (IsSupported)                                                |
| `Misc/khronosTextureContainer.ts`                                 |        1 | ✓ (new)  | ✅ Done (IsValid)                                                    |
| `Probes/reflectionProbe.ts`                                       |        1 | ✓ (new)  | ✅ Done (Parse)                                                      |
| `FrameGraph/Passes/renderPass.ts`                                 |        1 | ✓ (new)  | ✅ Done (IsRenderPass)                                               |
| `FrameGraph/Passes/objectListPass.ts`                             |        1 | ✓ (new)  | ✅ Done (IsObjectListPass)                                           |
| `FrameGraph/frameGraphTextureManager.ts`                          |        1 | ✓ (new)  | ✅ Done (CloneTextureOptions)                                        |
| `FrameGraph/Tasks/Rendering/csmShadowGeneratorTask.ts`            |        1 | ✓ (new)  | ✅ Done (IsCascadedShadowGenerator)                                  |
| `Materials/effect.ts`                                             |        1 |    ✗     | ⏭ Skip (Effect is heavily augmented — type divergence)              |
| `Materials/materialHelper.ts`                                     |       25 |    ✗     | ⏭ Skip (already delegates to standalone functions)                  |
| `Meshes/meshSimplification.ts`                                    |        2 |    ✗     | ⏭ Skip (internal non-exported class)                                |
| `Materials/Textures/videoTexture.ts`                              |        3 |    ✗     | ⏭ Skip (inline object types in params — manual later)               |
| `Misc/andOrNotEvaluator.ts`                                       |        1 |    ✗     | ⏭ Skip (calls private `_HandleParenthesisContent`)                  |
| `Misc/sceneRecorder.ts`                                           |        1 |    ✗     | ⏭ Skip (ApplyDelta accesses private members)                        |
| `Misc/HighDynamicRange/panoramaToCubemap.ts`                      |        1 |    ✗     | ⏭ Skip (uses private static helpers)                                |
| `Misc/dumpTools.ts`                                               |        1 |    ✗     | ⏭ Skip (internal class with @nativeOverride decorator)              |
| `Meshes/geometry.ts`                                              |        2 |    ✗     | ⏭ Skip (2 clean, low ROI)                                           |
| `Engines/abstractEngine.ts`                                       |        5 |    ✗     | ⏭ Skip (stubs, low ROI)                                             |
| **── Newly triaged files (from verification audit) ──**           |          |          |                                                                      |
| `Maths/math.plane.ts`                                             |        5 |    ✓     | ✅ Done (5 extracted: PlaneFromArray, etc.)                          |
| `Misc/sceneSerializer.ts`                                         |        4 |    ✓     | ✅ Done (4 extracted: ClearCache, Serialize, SerializeAsync, etc.)   |
| `Meshes/polygonMesh.ts`                                           |        4 |    ✓     | ✅ Done (4 extracted: Rectangle, Circle, Parse, StartingAt)          |
| `Meshes/csg.ts`                                                   |        2 |    ✓     | ✅ Done (2 extracted: CSGFromVertexData, CSGFromMesh)                |
| `Rendering/renderingGroup.ts`                                     |        4 |    ✗     | ⏭ Skip (@internal, sort callbacks read `_`-prefixed SubMesh fields) |
| `Physics/v2/physicsShape.ts`                                      |        4 |    ✗     | ⏭ Skip (trivial factory stubs, 3-5 lines each)                      |
| `Physics/physicsHelper.ts`                                        |        3 |    ✗     | ⏭ Skip (non-exported `HelperTools` class)                           |
| `Meshes/GaussianSplatting/gaussianSplattingMesh.ts`               |        3 |    ✗     | ⏭ Skip (deep private static dep chain)                              |
| `Materials/Textures/texture.ts`                                   |        3 |    ✗     | ⏭ Skip (constructor wrappers + private static hooks)                |
| `Materials/Textures/cubeTexture.ts`                               |        3 |    ✗     | ⏭ Skip (trivial constructor wrappers)                               |
| `Engines/WebGPU/webgpuCacheRenderPipelineTree.ts`                 |        3 |    ✗     | ⏭ Skip (@internal, private `_Cache` state)                          |
| `Engines/Processors/Expressions/shaderDefineExpression.ts`        |        3 |    ✗     | ⏭ Skip (@internal, private static caching)                          |
| `scene.pure.ts`                                                   |        2 |    ✓     | ⏭ Skip (factory property assignments, not methods)                  |
| `XR/features/WebXRHitTestLegacy.ts`                               |        2 |    ✗     | ⏭ Skip (low ROI, XR-specific)                                       |
| `PostProcesses/postProcess.ts`                                    |        2 |    ✗     | ⏭ Skip (RegisterShaderCodeProcessing + Parse, coupled)              |
| `Physics/v2/Plugins/havokPlugin.ts`                               |        2 |    ✗     | ⏭ Skip (readToRef on internal event classes)                        |
| `Particles/flowMap.ts`                                            |        2 |    ✗     | ⏭ Skip (factory async methods, low ROI)                             |
| `Morph/morphTarget.ts`                                            |        2 |    ✗     | ⏭ Skip (Parse + FromMesh, low ROI)                                  |
| `Misc/HighDynamicRange/cubemapToSphericalPolynomial.ts`           |        2 |    ✗     | ⏭ Skip (2 methods, low ROI)                                         |
| `Meshes/subMesh.ts`                                               |        2 |    ✗     | ⏭ Skip (AddToMesh + CreateFromIndices, factory stubs)               |
| `Meshes/csg2.ts`                                                  |        2 |    ✗     | ⏭ Skip (FromVertexData + FromMesh, factory stubs)                   |
| `Maths/math.functions.ts`                                         |        2 |    ✗     | ⏭ Skip (already standalone functions, not class statics)            |
| `Materials/shaderMaterial.pure.ts`                                |        2 |    ✗     | ⏭ Skip (ParseFromFileAsync + ParseFromSnippetAsync)                 |
| `Materials/meshDebugPluginMaterial.pure.ts`                       |        2 |    ✗     | ⏭ Skip (Reset + PrepareMesh, low ROI)                               |
| `Materials/material.ts`                                           |        2 |    ✗     | ⏭ Skip (ParseAlphaMode + Parse, deserialization stubs)              |
| `Materials/colorCurves.ts`                                        |        2 |    ✗     | ⏭ Skip (Bind + Parse, low ROI)                                      |
| `Lights/light.ts`                                                 |        2 |    ✗     | ⏭ Skip (GetConstructorFromName + Parse, deserialization)            |
| `Engines/WebGPU/webgpuCacheSampler.ts`                            |        2 |    ✗     | ⏭ Skip (@internal, GPU caching internals)                           |
| `Debug/skeletonViewer.ts`                                         |        2 |    ✗     | ⏭ Skip (shader factories, low ROI)                                  |
| `Cameras/camera.ts`                                               |        2 |    ✗     | ⏭ Skip (GetConstructorFromName + Parse, deserialization)            |
| `Bones/skeleton.ts`                                               |        2 |    ✗     | ⏭ Skip (MakeAnimationAdditive + Parse)                              |
| `Actions/actionManager.ts`                                        |        2 |    ✗     | ⏭ Skip (Parse + GetTriggerName, deserialization)                    |
| Files with 1 method each (71 files, mostly `Parse`/factories)     |       71 |  mixed   | ⏭ Skip (low ROI — 1 method per file, mostly deserialization)        |
| **Total**                                                         | **~636** |    —     | **~505 done, ~16 extractable remaining, rest skipped**               |

#### Verification Tooling

- **`scripts/treeshaking/verifyPhase4.mjs`** — Comprehensive verification script
    - Scans ALL `.ts` files in `packages/dev/core/src/` for classes with static methods
    - Cross-references every file against the tracking table above
    - Verifies "Done" files actually have standalone functions + augmentations
    - Reports untracked files, count mismatches, and stale entries
    - Usage: `node scripts/treeshaking/verifyPhase4.mjs [--verbose] [--verify-extractions]`
    - **Latest run**: 130 files with 483 static methods; 48 Done (all verified ✅), 18+103 Skip; 4 files extractable remaining

## Phase 5 — Update `sideEffects` in `package.json`

- [x] **5.1** — Switch from `["**/*"]` to explicit list (auto-generated from manifest)
    - Fixed `auditSideEffects.mjs`: template literal brace tracking + WGSL regex (`\w*Store\w*`)
    - Regenerated manifest: 1248 files with side effects, 1521 pure
    - Updated both `@dev/core` and `@babylonjs/core` `package.json` files
    - 627 entries: 2 glob patterns (`Shaders/**`, `ShadersWGSL/**`) + 625 individual files
- [x] **5.2** — Script to sync manifest → package.json (`scripts/treeshaking/syncSideEffects.mjs`)
    - Reads manifest, detects fully-SE directories for glob patterns, writes to both package.json files
    - Usage: `node scripts/treeshaking/syncSideEffects.mjs [--dry-run] [--verbose]`

## Phase 6 — Guardrails & CI Enforcement

- [x] **6.1** — Custom ESLint rule: `no-side-effect-imports-in-pure` (in `eslintBabylonPlugin`)
    - Flags bare (side-effect) imports in `.pure.ts` files (45 existing instances)
    - Verifies barrel `pure.ts` files only re-export from side-effect-free modules (manifest-aware)
    - Configured as `warn` in `eslint.config.mjs` for `**/*.pure.ts` and `**/pure.ts`
- [x] **6.2** — Bundle-size smoke tests (Rollup + Webpack, 16 test cases — all passing)
    - `npm run test:treeshaking` → `scripts/treeshaking/bundleSmokeTest.mjs`
- [x] **6.3** — CI step: audit script output must match committed manifest
    - `npm run check:manifest-drift` → `scripts/treeshaking/checkManifestDrift.mjs`
    - Regenerates manifest from source, diffs against committed copy, reports added/removed files

---

## Execution Order

```
Phase 0 (Audit tooling)  ← DONE
  ├─> Phase 1 (#__PURE__ annotations)        ← DONE
  └─> Phase 2 (FILE.pure.ts splits)          ← DONE (7 edge cases remain)
        └─> Phase 3 (pure.ts barrels)        ← DONE
              └─> Phase 4 (static helpers)   ← DONE (69% coverage, expandable)
                    └─> Phase 5 (sideEffects in package.json)  ← DONE
                          └─> Phase 6 (CI guardrails)  ← DONE
```

## Risk Mitigation

| Risk                           | Mitigation                                              |
| ------------------------------ | ------------------------------------------------------- |
| Breaking existing imports      | `FILE.ts` always re-exports `FILE.pure.ts`              |
| Circular dependencies          | Audit detects cycles; `import/no-cycle` already enabled |
| Prototype augmentation in pure | ESLint rule (6.1) + bundle tests (6.2)                  |
| Massive PRs                    | One PR per subdirectory (Phase 2.2 priority order)      |
| Shader files in pure           | Blocked by glob pattern in ESLint rule                  |
