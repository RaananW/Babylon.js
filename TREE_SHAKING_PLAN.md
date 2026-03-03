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

- [ ] **3.1** — Add `pure.ts` sibling to every subdirectory `index.ts`
- [ ] **3.2** — Root-level `packages/dev/core/src/pure.ts`
- [ ] **3.3** — Update public package exports: `@babylonjs/core/pure`

## Phase 4 — Factor Out Static Helpers

- [ ] **4.1** — Identify static methods that can become module-level functions
- [ ] **4.2** — Prioritize: `Vector3`, `Matrix`, `Quaternion`, `Color3/4`, `Animation`, `Mesh`

## Phase 5 — Update `sideEffects` in `package.json`

- [ ] **5.1** — Switch from `["**/*"]` to explicit list (auto-generated from manifest)
- [ ] **5.2** — Script to sync manifest → package.json (`scripts/treeshaking/syncSideEffects.ts`)

## Phase 6 — Guardrails & CI Enforcement

- [ ] **6.1** — Custom ESLint rule: `no-side-effect-imports-in-pure` (in `eslintBabylonPlugin`)
- [ ] **6.2** — Bundle-size smoke tests (Rollup + Webpack, `import "@babylonjs/core/pure"` → empty bundle)
- [ ] **6.3** — CI step: audit script output must match committed manifest

---

## Execution Order

```
Phase 0 (Audit tooling)  ← DONE
  ├─> Phase 1 (#__PURE__ annotations)        ← DONE
  └─> Phase 2 (FILE.pure.ts splits)          ← DONE (7 edge cases remain)
        └─> Phase 3 (pure.ts barrels)        — depends on splits
              └─> Phase 4 (static helpers)   — can overlap with Phase 3
                    └─> Phase 5 (sideEffects in package.json)
                          └─> Phase 6 (CI guardrails)
```

## Risk Mitigation

| Risk                           | Mitigation                                              |
| ------------------------------ | ------------------------------------------------------- |
| Breaking existing imports      | `FILE.ts` always re-exports `FILE.pure.ts`              |
| Circular dependencies          | Audit detects cycles; `import/no-cycle` already enabled |
| Prototype augmentation in pure | ESLint rule (6.1) + bundle tests (6.2)                  |
| Massive PRs                    | One PR per subdirectory (Phase 2.2 priority order)      |
| Shader files in pure           | Blocked by glob pattern in ESLint rule                  |
