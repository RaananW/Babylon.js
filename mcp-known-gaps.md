# MCP Server Known Gaps & Bugs

Discovered during basketball game scene testing (Feb 2026).

---

## Scene MCP Server

### `add_mesh` — Sphere parameters not preserved in export

- **Symptom**: Creating a Sphere with `diameter: 0.48, segments: 16` exports as `CreateSphere("templateBall", {}, scene)` — parameters are lost.
- **Workaround**: Use `set_transform` with scaling to achieve the desired size.

### `add_mesh` — `position` parameter exported as `undefined`

- **Symptom**: Passing `position: [0, -10, 0]` to `add_mesh` results in exported code: `new BABYLON.Vector3(undefined, undefined, undefined)`.
- **Workaround**: Call `set_transform` separately after `add_mesh` to set position.ƒ

### `set_mesh_properties` — `isVisible: false` not reflected in export

- **Symptom**: Setting `isVisible: false` via `set_mesh_properties` reports success, but the exported code does not include `mesh.isVisible = false` or `mesh.setEnabled(false)`.
- **Workaround**: Position the mesh out of view (e.g., y=-10) or handle visibility in runtime code.

### No `remove_physics_body` tool

- **Symptom**: There is no tool to remove a physics body from a mesh. `remove_physics_constraint` exists but requires a `constraintId` and is unrelated.
- **Workaround**: Remove the mesh entirely and re-add it without physics.

### `GetAssetBlock` — index-based mesh lookup is fragile

- **Symptom**: `GetAssetBlock(type="Mesh", index=0)` resolves to `scene.meshes[0]`, which is the skybox (auto-created), not the first user-created mesh. The index depends on creation order including internal meshes.
- **Impact**: Easy to pick the wrong mesh. No name-based lookup available.
- **Suggestion**: Support `useIndexAsUniqueId` or add a name-based lookup mode in the MCP server.

### Export generates `uniqueId` assignments that may conflict

- **Symptom**: Exported code sets `mesh.uniqueId = N` with hardcoded values. If scene internals already used those IDs, collisions can occur.
- **Impact**: Low in practice but worth noting for robustness.

---

## Flow Graph MCP Server

### `FunctionReference` (Mode B / inline code) — no direct execution path

- **Symptom**: `FunctionReference` with `config.code` is a data-only block. It cannot execute code by itself — it needs a `CodeExecutionBlock` + `SetPropertyBlock` chain to actually trigger.
- **Impact**: The block graph for "run code on event" is non-obvious: `MeshPickEvent → SetProperty(in) ← CodeExecution(result) ← FunctionReference(output)`. The signal/data split makes this awkward.
- **Suggestion**: Consider a simpler "run code on signal" execution block.

### Injected function wiring via `_setConnectionValueByKey` is internal API

- **Symptom**: The exported code uses `_ctx._setConnectionValueByKey(uniqueId, fn)` to inject the runtime function. This is a private/internal method.
- **Impact**: Fragile — may break across versions. No public API for injecting external functions into flow graph contexts.

---

## NME MCP Server

### Node Materials not rendering correctly in scene preview

- **Symptom**: Two NME materials (BasketballMaterial with procedural seam lines + Simplex Perlin noise, BasketRimMaterial with metallic PBR) were created, validated successfully, and attached to meshes, but did not render correctly in the scene preview.
- **Status**: Not yet debugged — replaced with plain PBR materials as workaround.
- **Note**: Both materials validated successfully within the NME MCP server itself.

---

## General / Cross-Server

### Preview server loads limited CDN scripts

- **Symptom**: The preview server HTML only loads `babylon.js`, `babylonjs.loaders.min.js`, and `HavokPhysics_umd.js`. Initially suspected FlowGraph was missing, but it is bundled in `babylon.js`.
- **Actual issue**: The blank page was caused by something else in the flow graph setup, not missing scripts. The `.catch(console.error)` on `createScene()` made errors appear silent.
- **Suggestion**: Add more visible error reporting in the preview template (e.g., display errors on the canvas).

### `attach_flow_graph` requires JSON file, not in-memory reference

- **Symptom**: Cannot attach a flow graph by name alone. Must `export_graph_json` to a file first, then pass the file path to `attach_flow_graph`.
- **Impact**: Extra round-trip and temporary file for every attach operation.
- **Suggestion**: Allow `attach_flow_graph` to accept a graph name from the flow graph MCP server directly.

### Skybox `CubeTexture("")` prevents scene from ever becoming ready

- **Symptom**: When no `environmentTexture` is set but a skybox is created, the code generator emits `new BABYLON.CubeTexture("", scene)`. A `CubeTexture` with an empty URL never becomes ready, which blocks `scene.isReady()` → `scene.whenReadyAsync()` hangs forever → `ParseCoordinatorAsync` (used by flow graphs) never resolves → the render loop never starts → **blank page**.
- **Root cause**: `codeGenerator.ts` line 277 used `env.environmentTexture ?? ""` as the fallback URL.
- **Fix**: Guard the `reflectionTexture` assignment so it only runs when `env.environmentTexture` is actually set. Committed in `codeGenerator.ts`.

### Render loop placed AFTER `ParseCoordinatorAsync` causes deadlock

- **Symptom**: The generated code placed `engine.runRenderLoop(...)` after `await ParseCoordinatorAsync(...)`. Since `ParseCoordinatorAsync` internally calls `scene.whenReadyAsync()`, and PBR materials may need a render pass to compile their shaders, this ordering creates a chicken-and-egg deadlock — the scene can't become ready without rendering, and rendering can't start until the scene is ready.
- **Root cause**: `codeGenerator.ts` pushed the flow graph section to `bodyParts` before the render loop section.
- **Fix**: Moved the render loop section before the flow graph section in the code generator. Now the engine starts rendering immediately, and flow graphs parse in the background while the scene is alive.

### `setCollisionCallbackEnabled(true)` added to all physics bodies unnecessarily

- **Symptom**: Every physics body in the exported code gets `setCollisionCallbackEnabled(true)`, even when no collision callbacks are configured. This adds overhead for collision detection that is never used.
- **Impact**: Minor performance cost; clutters generated code.
- **Suggestion**: Only emit `setCollisionCallbackEnabled(true)` when the mesh actually has collision observers or callbacks configured.

### `setBlockConfig` does not normalize config key aliases (Gap 44)

- **Symptom**: `FlowGraphSetVariableBlock: variable/variables is not defined` error at runtime. The flow-graph MCP's `set_block_config` tool uses `Object.assign` to merge config without alias normalization. If the LLM passes `variableName` instead of `variable`, it's stored as-is. The engine's `FlowGraphSetVariableBlock` constructor requires `config.variable`, so deserialization fails.
- **Root cause**: The `addBlock()` method had alias normalization (`variableName` → `variable`, `eventName` → `eventId`, etc.) but `setBlockConfig()` and `importJSON()` did not.
- **Fix**: Extracted alias normalization into `_normalizeConfigAliases()` helper; called from `addBlock()`, `setBlockConfig()`, and `importJSON()`. Also added defense-in-depth normalization in scene-mcp-server's `_fixupConfigDefaults()` during code generation.
- **Affected blocks**: `FlowGraphSetVariableBlock` (`variableName` → `variable`), `FlowGraphGetVariableBlock` (`variableName` → `variable`), `FlowGraphSendCustomEventBlock` / `FlowGraphReceiveCustomEventBlock` (`eventName` → `eventId`).

---

## Parameter Naming Inconsistencies (Session 3 rebuild)

These are UX friction points where the LLM (or a human) naturally guesses a parameter name that doesn't match what the tool actually expects. Each one caused a failed call during the rebuild.

### Gap 45: `add_light` — `type` not `lightType`

- **Symptom**: Calling `add_light` with `lightType: "HemisphericLight"` fails. The parameter is named `type`.
- **Natural expectation**: Since `add_mesh` has `type` for mesh type, `lightType` feels like a reasonable disambiguated name.
- **Suggestion**: Accept `lightType` as an alias for `type`, or make the error message hint at the correct parameter name.

### Gap 46: `configure_material` — `materialId` not `materialName`

- **Symptom**: Calling `configure_material` with `materialName: "courtMat"` fails. The parameter is `materialId`.
- **Cross-tool confusion**: `add_meshes_batch` uses `materialName` in each mesh entry to assign a material. But `configure_material` uses `materialId`. The same string (e.g., `"courtMat"`) works in both, but the key name differs.
- **Suggestion**: Accept both `materialName` and `materialId` in `configure_material`, or unify naming across tools.

### Gap 47: `set_transform` — `name` not `meshName`

- **Symptom**: Calling `set_transform` with `meshName: "ground"` fails. The parameter is `name` (or `nodeId`/`meshId`).
- **Natural expectation**: Since `add_physics_body` uses `meshId` and many tools reference meshes by name, `meshName` is a natural guess.
- **Suggestion**: Accept `meshName` as an alias, or standardize on one naming convention across all tools.

### Gap 48: `add_physics_body` — `meshId` not `meshName`, and `bodyType` not `motionType`

- **Symptom**: Two parameter name mismatches in one call:
    1. `meshName` doesn't work — must use `meshId`
    2. `motionType` doesn't work — must use `bodyType`
- **Natural expectation**: Babylon.js engine uses `PhysicsMotionType` enum, so `motionType` feels natural. The mesh parameter is a name string, so `meshName` feels natural.
- **Suggestion**: Accept aliases `meshName` → `meshId` and `motionType` → `bodyType`.

### Gap 49: GUI Button — `buttonText` not `text` for label

- **Symptom**: Setting `text: "Throw Ball"` on a Button control doesn't set the visible label. The correct property is `buttonText`.
- **Natural expectation**: Most UI frameworks use `text` or `label` for button text.
- **Context**: Babylon.js GUI `Button.CreateSimpleButton(name, text)` takes text as the second constructor arg, and internally creates a `TextBlock` child. The MCP uses `buttonText` to distinguish from the child's `text` property.
- **Suggestion**: Accept `text` as a shorthand for `buttonText` on Button controls, or document this in the tool description.

### Gap 50: `connect_signals_batch` — `graphName` at top level, not per-connection

- **Symptom**: Putting `graphName` inside each connection object (like `{ graphName, fromBlock, ... }`) fails. The `graphName` must be a top-level parameter alongside the `connections` array.
- **Natural expectation**: When batching, it feels logical to put all context inside each item.
- **Suggestion**: Either accept `graphName` in both locations (top-level preferred, per-item as override), or add a clear error message when `graphName` is missing from top level.

### Gap 51: `add_mesh` inline physics — `bodyType` "Dynamic" stored as `ANIMATED`

- **Symptom**: Adding a mesh with `physics: { bodyType: "Dynamic", ... }` via `add_mesh` would result in the physics body being generated as `BABYLON.PhysicsMotionType.ANIMATED` in the output code. The ball would not respond to gravity or `setLinearVelocity`.
- **Root cause 1**: `catalog.ts` had `PhysicsBodyTypes` with swapped values: `Dynamic: 1, Animated: 2`. Babylon.js uses `STATIC=0, ANIMATED=1, DYNAMIC=2` — so Dynamic should map to 2, not 1.
- **Root cause 2**: The `add_mesh` inline physics path passed `physics.bodyType` (a raw string) directly to `addPhysicsBody()` without the Gap 21 normalization that the standalone `add_physics_body` tool handler applied. So "Dynamic" went through `PhysicsBodyTypes["Dynamic"]` → 1 (wrong), instead of the correct `bodyTypeMap["dynamic"]` → 2.
- **Fix**: Corrected `catalog.ts` mappings (`Animated: 1, Dynamic: 2`) and added Gap21-style normalization to the inline physics path in `add_mesh`.
- **Workaround** (before fix): Re-add the physics body using the standalone `add_physics_body` tool, which has the correct normalization and will overwrite the stored bodyType to 2.

### Summary of naming friction

| Tool                    | LLM guessed          | Correct param         | Gap |
| ----------------------- | -------------------- | --------------------- | --- |
| `add_light`             | `lightType`          | `type`                | 45  |
| `configure_material`    | `materialName`       | `materialId`          | 46  |
| `set_transform`         | `meshName`           | `name`                | 47  |
| `add_physics_body`      | `meshName`           | `meshId`              | 48a |
| `add_physics_body`      | `motionType`         | `bodyType`            | 48b |
| GUI Button property     | `text`               | `buttonText`          | 49  |
| `connect_signals_batch` | per-item `graphName` | top-level `graphName` | 50  |
