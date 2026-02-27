# Known Gaps — Babylon.js MCP Servers

Discovered during basketball-game scene-building test using only MCP servers (scene, flow-graph, gui, nme).

---

## Previously Identified Gaps (Sessions 1–3)

### Gap 1 — Silent parameter stripping (Zod `.strip()`)

**Status:** ✅ Partially fixed  
**Symptom:** Parameters passed at the top level of a tool call (e.g. `position`, `rotation`, `material`) are silently stripped by Zod's default behavior when they aren't in the schema, with no error returned.  
**Fix applied:** Added convenience aliases on `add_mesh`, `add_meshes_batch`, `add_material`, `add_transform_node`, `add_model` for the most common fields (position/rotation/scaling/material/albedoColor/metallic/roughness).  
**Still affected:** `add_camera` and `add_light` — see Gap 11.

### Gap 2 — No `configure_material` tool

**Status:** ✅ Fixed  
**Fix:** Added `configure_material` tool + `configureMaterialProperties()` in sceneManager.

### Gap 3 — NME JSON inline in context

**Status:** ✅ Already implemented  
**Note:** `outputFile` param exists on NME export. `nmeJsonFile` param exists on `add_material`.

### Gap 4 — No dedicated physics Flow Graph blocks

**Status:** ⚠️ Workaround via CodeExecution block  
**Note:** Core engine blocks (ApplyImpulse, SetPhysicsVelocity) were not added per user directive — no changes outside MCP servers. Use the `CodeExecution` block with `FunctionReference` to call `physicsBody.setLinearVelocity()`, `physicsBody.applyImpulse()`, etc.

### Gap 5 — Phantom blocks in FG registry

**Status:** ✅ Fixed  
**Fix:** Removed 8 non-existent block entries from `flow-graph-mcp-server/src/blockRegistry.ts`.

### Gap 6 — No clone mesh Flow Graph block

**Status:** ⚠️ Workaround via CodeExecution block  
**Note:** Same as Gap 4 — use `CodeExecution` + `FunctionReference` with `mesh.clone`.

### Gap 7 — Cross-server NME reference

**Status:** ✅ Already implemented  
**Note:** `nmeJsonFile` and `coordinatorJsonFile` params exist on the scene server tools.

### Gap 8 — Missing uniqueId in generated code

**Status:** ✅ Fixed  
**Fix:** Code generator now emits `mesh.uniqueId = N` using `extractNumericId()`.

### Gap 9 — Flow Graph JSON emitted as escaped string

**Status:** ✅ Fixed  
**Fix:** Code generator now parses FG JSON strings and emits them as inline JS object literals.

### Gap 10 — `coordinatorJsonFile` not documented

**Status:** ✅ Already implemented  
**Note:** Both `coordinatorJson` and `coordinatorJsonFile` are documented on `attach_flow_graph`.

---

## New Gaps (Session 4 — Basketball Scene Rebuild)

### Gap 11 — `add_camera` / `add_light` lack convenience aliases

**Status:** ✅ Fixed (Session 4)  
**Symptom:** Agents naturally pass camera params (`alpha`, `beta`, `radius`, `target`) and light params (`direction`, `intensity`, `groundColor`) at the top level of the tool call instead of nesting them inside `properties: { ... }`. Zod silently strips them.  
**Fix applied:** Added top-level convenience aliases on `add_camera` (alpha, beta, radius, target, position, speed, fov, minZ, maxZ) and `add_light` (direction, position, intensity, diffuse, specular, groundColor, range, angle, exponent, shadowEnabled), merged into `properties` in the handler.  
**Validated:** Session 5 — camera with `alpha: -1.5708, beta: 1.2, radius: 18, target: [0, 2, 0]` correctly applied.

### Gap 12 — `add_meshes_batch` silently drops physics data

**Status:** ✅ Fixed (Session 4)  
**Symptom:** Physics data passed inline with meshes in batch was silently stripped because the batch schema didn't include a `physics` field.  
**Fix applied:** Added `PhysicsSchema` as optional `physics` field on both `add_mesh` and `add_meshes_batch`. Handler internally calls `addPhysicsBody()`.  
**Validated:** Session 5 — all 5 meshes (court, backboard, rim, ball, net) received physics bodies via `add_meshes_batch` with inline physics.

### Gap 13 — `set_environment` physics param name mismatch

**Status:** ✅ Fixed (Session 4)  
**Symptom:** `physicsEngine: "HavokPlugin"` was silently stripped; schema expected `physicsEnabled: true` + `physicsPlugin: "havok"`.  
**Fix applied:** Added `physicsEngine` as a convenience alias that normalizes to `physicsPlugin` + `physicsEnabled: true`. Also auto-enables physics when `gravity` is set.  
**Validated:** Session 5 — `physicsEngine: "HavokPlugin"` correctly configured physics.

### Gap 14 — Button text not emitted in generated code

**Status:** ✅ Fixed (Session 4)  
**Symptom:** `Button.CreateSimpleButton("button_2", "")` — empty string instead of the actual button text.  
**Root cause:** Code generator read `def.text` but Button stores text in a child TextBlock.  
**Fix applied:** In `codeGenerator.ts`, for `className === "Button"`, extract text from child TextBlock matching `def.textBlockName`.  
**Validated:** Session 5 — generated code correctly emits `CreateSimpleButton("button_2", "SHOOT!")`.

---

## New Gaps (Session 5 — Basketball Scene Rebuild)

### Gap 15 — Material type enum requires full class name

**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs naturally try `"PBR"` as the material type, but the enum requires `"PBRMaterial"`. The error message is clear (lists valid values), so it's recoverable, but it wastes a tool call.  
**Impact:** Low — error is descriptive and LLM self-corrects on retry.  
**Fix applied:** Changed the `type` parameter from `z.enum()` to `z.string()` and added a `materialTypeAliases` map in the handler that resolves `"PBR"` → `"PBRMaterial"`, `"Standard"` → `"StandardMaterial"`, `"Node"` → `"NodeMaterial"` (case-insensitive). Invalid types produce a clear error listing valid values and aliases.

### Gap 16 — GUI `add_control` / `add_controls_batch`: common properties at top level are silently stripped

**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs naturally pass control properties (`text`, `fontSize`, `color`, `background`, `width`, `height`, `buttonText`) at the top level of each control definition instead of nesting them inside the `properties: { ... }` object. Zod strips them silently — no error, no warning.  
**Example:** Agent sends `{ controlType: "TextBlock", text: "Score: 0", fontSize: 24, color: "white" }` — all three properties are stripped. Must be `{ controlType: "TextBlock", properties: { text: "Score: 0", fontSize: 24, color: "white" } }`.  
**Impact:** High — controls are created with default/empty values. Requires a separate `set_control_properties` call to fix, doubling the number of tool calls.  
**Root cause:** Same as Gap 1 — Zod's `.strip()` behavior on unknown fields.  
**Fix applied:** Added 14 convenience aliases (text, fontSize, color, background, width, height, top, left, buttonText, isVertical, thickness, cornerRadius, horizontalAlignment, verticalAlignment) as explicit schema fields on both `add_control` and `add_controls_batch`. The handler merges them into `properties` (top-level aliases don't override explicit `properties` entries).

### Gap 17 — GUI control `name` vs `controlName` parameter naming

**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs naturally pass `name: "scoreText"` but the schema field is `controlName`. The `name` parameter is stripped by Zod, so an auto-generated name (e.g., `textblock_1`) is used instead.  
**Impact:** Medium — controls get non-descriptive auto-generated names, making subsequent references harder.  
**Fix applied:** Added `name` as a convenience alias for `controlName` in both `add_control` and `add_controls_batch` schemas. The handler resolves `controlName ?? name`.

### Gap 18 — Flow Graph batch API parameter naming inconsistencies

**Status:** ✅ Fixed (Session 6)  
**Symptom:** Several parameter names in the Flow Graph MCP server don't match what LLMs naturally produce:

- `blockType` vs `type` — LLMs try `type` first
- `signalOutputName` vs `outputName` — LLMs try `outputName` first  
  **Impact:** Low-medium — error messages are generally descriptive, so LLMs self-correct, but each mismatch wastes a tool call.  
  **Fix applied:** Added convenience aliases in both single and batch tools: `type` → `blockType` in `add_blocks_batch`, `outputName` → `signalOutputName` in `connect_signal` and `connect_signals_batch`. Handlers resolve using `?? alias` pattern.

### Gap 19 — SetVariable/GetVariable config key `variableName` vs `variable`

**Status:** ✅ Fixed (Session 5)  
**Symptom:** `FlowGraphSetVariableBlock: variable/variables is not defined` at scene init. The engine requires `config.variable` (or `config.variables`), but LLMs pass `config.variableName` — influenced by the `set_variable` MCP tool which uses `variableName` as its parameter name.  
**Root cause:** The `addBlock()` config normalization only did case-insensitive matching, which doesn't catch `variableName` → `variable` (different string, not just a case difference). The mismatch is stored in the coordinator JSON, and at runtime `ParseCoordinatorAsync` creates a `FlowGraphSetVariableBlock` with `config: { variableName: "score" }` — the constructor finds neither `variable` nor `variables` and throws.  
**Fix applied:** Added an explicit `CONFIG_ALIASES` map in `flowGraphManager.ts:addBlock()` that maps `variableName` → `variable`, `variableNames` → `variables`, `varName` → `variable`, and `eventName` → `eventId`. The alias resolution runs before the case-insensitive fallback.

### Gap 20 — FunctionReference `config.code` not an engine feature

**Status:** ✅ Fixed (Session 5)  
**Symptom:** The shoot button fires the custom event but the basketball never moves. The flow graph's FunctionReference → CodeExecution chain produces `undefined` instead of executing the shooting logic.  
**Root cause:** The engine's `FlowGraphFunctionReferenceBlock` is designed to look up a method by name on a live object (`object[functionName].bind(context)`). It completely ignores any `config.code` field — there is no engine block that compiles arbitrary code strings from JSON config into callable functions. When the MCP LLM places shooting code in `config.code` and leaves `functionName`/`object` inputs unconnected, `_updateOutputs` silently does nothing → CodeExecution gets no function → no physics impulse is applied.  
**Fix applied (two parts):**

1. **Code generator** (`scene-mcp-server/src/codeGenerator.ts`): Added `_extractCodeInjections()` that scans the coordinator JSON for FunctionReference blocks with `config.code`. For each match, the code generator emits the code as a real JavaScript function and injects it into the FunctionReference's output connection via `context._setConnectionValueByKey(outputUniqueId, fn)` on every execution context. Because FunctionReference's `_updateOutputs` silently does nothing when inputs are empty, the pre-set value persists and is correctly returned to the downstream CodeExecution block.
2. **Block registry** (`flow-graph-mcp-server/src/blockRegistry.ts`): Added explicit `config.code` documentation to the FunctionReference block entry, describing Mode A (object+functionName lookup) vs Mode B (inline code via config.code compiled by the code generator). This guides LLMs to correctly use config.code for arbitrary code execution.

---

### Gap 21 — Physics bodyType/shapeType require numeric codes and PascalCase strings

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs naturally try `bodyType: "STATIC"`, `bodyType: "DYNAMIC"`, `shapeType: "BOX"`, `shapeType: "SPHERE"` — all fail. The tool requires `bodyType` as a numeric code (0 = STATIC, 1 = ANIMATED, 2 = DYNAMIC) and `shapeType` as a PascalCase string ("Box", "Sphere", "Mesh", "Container").  
**Root cause:** The Zod schema uses `z.number()` for bodyType and a case-sensitive `z.enum()` for shapeType. No string aliases are provided for bodyType, and shapeType doesn't accept uppercase variants.  
**Fix applied:** Handler now normalizes bodyType strings case-insensitively ("static"→0, "animated"→1, "dynamic"→2). shapeType changed from `z.enum()` to `z.string()` with case-insensitive normalization to PascalCase in the handler.

---

### Gap 22 — PHYSICS_BODY_TYPE_NAMES mapping was swapped in code generator

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** Exported scene code uses `PhysicsMotionType.ANIMATED` for bodyType 2 (should be DYNAMIC) and `PhysicsMotionType.DYNAMIC` for bodyType 1 (should be ANIMATED). Basketball gets ANIMATED motion type, making it behave as a kinematic body instead of a fully dynamic physics body.  
**Root cause:** `PHYSICS_BODY_TYPE_NAMES` in `codeGenerator.ts` had entries 1 and 2 swapped: `{ 0: "STATIC", 1: "DYNAMIC", 2: "ANIMATED" }`.  
**Fix applied:** Changed to `{ 0: "STATIC", 1: "ANIMATED", 2: "DYNAMIC" }` at lines 166-170 in `codeGenerator.ts`.

---

### Gap 23 — configure_light requires properties wrapper and lightId

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs naturally try `configure_light({ name: "sunLight", direction: {...}, intensity: 0.9 })` — fails because the tool requires `lightId` (not `name`) and all configurable properties must be wrapped inside a `properties: {}` object.  
**Root cause:** The tool schema defines `lightId` as the identifier and nests all configurable props inside `properties`. This is technically correct but unintuitive — the pattern matches Gap 16 (GUI properties stripping).  
**Fix applied:** Added `name` as alias for `lightId`. Added top-level convenience aliases for common light properties (direction, intensity, diffuse, specular, groundColor, range, shadowEnabled) that merge into `properties`.

---

### Gap 24 — set_transform requires nodeId, not meshId

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs try `set_transform({ meshId: "basketball", position: {...} })` — fails. The tool requires `nodeId` since it operates on any TransformNode, not just meshes.  
**Root cause:** The parameter is correctly generalized to `nodeId` since cameras and lights are also transform nodes. But for mesh-heavy scenes, LLMs default to `meshId`.  
**Fix applied:** Added `meshId` and `name` as aliases for `nodeId`. Handler resolves `nodeId ?? meshId ?? name`.

---

### Gap 25 — attach_flow_graph uses coordinatorJsonFile, not flowGraphJsonFile

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs try `attach_flow_graph({ flowGraphJsonFile: "...", scene: "..." })` — fails. The required parameters are `coordinatorJsonFile` (the file reference from `export_scene_code`/`describe_scene`) and `name` (a user-friendly name for the coordinator).  
**Root cause:** The parameter name matches the internal Babylon.js concept ("FlowGraphCoordinator") but LLMs expect "flowGraph" since that's the concept they've been working with. The `name` param is easy to miss.  
**Fix applied:** Added `flowGraphJsonFile` as alias for `coordinatorJsonFile`, `flowGraphJson` as alias for `coordinatorJson`. Made `name` optional with default `"flowGraph"`.

---

### Gap 26 — add_camera requires type, not cameraType

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** LLMs try `add_camera({ cameraType: "ArcRotateCamera", ... })` — fails. The param is just `type`.  
**Root cause:** Other tools use descriptive param names (`meshType`, `lightType`), but `add_camera` uses the shorter `type`. Inconsistent naming across add\*\* tools.  
**Fix applied:** Added `cameraType` as alias for `type`. Changed `type` from `z.enum()` to `z.string()` with case-insensitive validation and clear error message listing valid types.

---

### Gap 27 — GUI create_gui uses name but subsequent tools use guiName

**Server:** gui-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** `create_gui({ name: "hud" })` works, but then `add_control({ name: "hud", ... })` fails — subsequent tools require `guiName: "hud"`. The `name` parameter in add_control became the control's display name via Gap 17 fix.  
**Root cause:** `create_gui` uses `name` for the GUI identifier, but all other tools (`add_control`, `add_controls_batch`, `describe_gui`, etc.) use `guiName` for that same identifier. After Gap 17 added `name` as alias for `controlName`, passing `name` to `add_control` sets the control name rather than targeting the GUI.  
**Fix applied:** Added `guiName` as alias for `name` in `create_gui`. Handler resolves `name ?? guiName`.

---

### Gap 28 — Constant block output port named "output" not "value"

**Server:** flow-graph-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** When connecting Constant block's output, LLMs try `outputName: "value"` — fails. The actual port name is `"output"`. Most other blocks use `"value"` for their primary data output (GetVariable, Add, etc.), making this inconsistent.  
**Root cause:** The engine's FlowGraphConstantBlock defines its output as `"output"`, different from the convention used by other data blocks.  
**Fix applied:** Added port name alias mapping in `connectData()` — `"value"` ↔ `"output"` for both data outputs and inputs. If exact name match fails, tries aliases before returning error.

---

### Gap 29 — CodeExecution is a lazy data block, not an execution block

**Server:** flow-graph-mcp-server  
**Status:** 🟡 Info (Engine design — cannot change without engine modifications)  
**Symptom:** LLMs expect CodeExecution to have signal input/output ports (like ConsoleLog or SetDelay) so they can trigger actions directly. Instead, CodeExecution is a fully lazy data block — it evaluates only when a downstream block reads its `result` output. To actually trigger side effects (like applying a physics impulse), you need an execution block (e.g., ConsoleLog) downstream that reads the CodeExecution's result.  
**Root cause:** Engine design — FlowGraphCodeExecutionBlock extends data block, not execution block. The block description says "escape hatch for any logic" which implies it can be directly triggered, but it cannot.  
**Workaround:** Chain: `ReceiveCustomEvent → ConsoleLog`, connect `CodeExecution.result → ConsoleLog.message`. ConsoleLog fires on signal → reads result → triggers CodeExecution's lazy evaluation → side effects happen. This is the pattern used in the basketball scene for throwForce and resetBall.

---

### Gap 30 — collisionCounter integration type is misleadingly named

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** The `collisionCounter` integration type is used to display a score in a GUI TextBlock, incrementing on each physics collision event. The name implies it's strictly for collision counting, but it's actually a general-purpose event counter + text display integration.  
**Root cause:** The integration was originally designed for collision counting, but its parameterization (targetControlName, prefix, event source) makes it usable for any event-based counter display.  
**Fix applied:** Added `"eventCounter"` and `"scoreDisplay"` as aliases for `"collisionCounter"` in the schema. Handler normalizes aliases to `"collisionCounter"` before passing to manager. Updated tool description to document aliases.

---

### Gap 31 — CodeExecution blocks with config.code not getting injected functions

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** `FlowGraphCodeExecutionBlock` blocks with `config.code` have their code ignored at runtime — the injected function is never set, so `_updateOutputs` gets no function and produces `undefined`.  
**Root cause:** The code generator's `_extractCodeInjections()` only matched `FlowGraphFunctionReference` blocks. `FlowGraphCodeExecutionBlock` blocks with `config.code` were never scanned. Additionally, the function signature used `fgContext` but the engine passes the second arg as `context`.  
**Fix applied:** Extended `_extractCodeInjections()` to also match `FlowGraphCodeExecutionBlock` class. For CodeExecution blocks, the injection targets the `function` INPUT connection (not output). Changed function parameter name from `fgContext` to `context` so user code can reference `context.assetsContext`.

---

### Gap 32 — Event block signal wiring defaults to `out` instead of `done`

**Server:** flow-graph-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** Flow graph execution chain fires immediately on page load instead of waiting for the custom event to be triggered (e.g., button click).  
**Root cause:** `FlowGraphEventBlock` (parent of `ReceiveCustomEventBlock`) extends `FlowGraphAsyncExecutionBlock`, which has two signal outputs: `out` (fires immediately on startup via `_startPendingTasks`) and `done` (fires when the actual event is triggered via `_execute`). When the flow-graph MCP's `connect_signal` tool is used with event blocks, LLMs naturally specify `out` as the source output — matching the naming used by most execution blocks. But for event blocks, `done` is the semantically correct output that fires on event trigger.  
**Impact:** Critical — entire flow graph runs on page load, game logic triggers before any user interaction.  
**Fix applied (two parts):**

1. **Manual fix (Session 6):** Re-wired ReceiveCustomEvent blocks from `out` to `done`.
2. **Auto-remap (Session 6):** `connectSignal()` in `flowGraphManager.ts` now auto-remaps `"out"` → `"done"` for Event-category blocks that have a `done` output. The `connect_signal` tool handler shows an informational note when remapping occurs.

### Gap 33 — `attach_flow_graph` adds duplicate instead of replacing

**Server:** scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** Calling `attach_flow_graph` a second time with the same graph name adds a **second** flow graph entry to the scene instead of replacing the existing one, causing `Identifier '…CoordinatorJson' has already been declared` at runtime.  
**Root cause:** The scene manager's `attachFlowGraph` method always pushes a new entry to the `flowGraphs` array without checking if one with the same name already exists.  
**Impact:** Moderate — generated code declares the same coordinator variable twice, causing a runtime SyntaxError. Requires manual `remove_flow_graph` before re-attaching.  
**Fix applied:** `attachFlowGraph()` in `sceneManager.ts` now checks for existing flow graph with same name and replaces it in-place instead of pushing a duplicate.

### Gap 34 — Config values not propagated to data input defaults

**Server:** flow-graph-mcp-server + scene-mcp-server  
**Status:** ✅ Fixed (Session 6)  
**Symptom:** Block config values (e.g. `config.duration = 4` on a SetDelay block) are stored in the block config but never reflected in the corresponding data input's default value. The engine reads duration from the `duration` data input which defaults to 0 (the type-level default for numbers), not 4.  
**Root cause:** The flow-graph MCP server's `addBlock` method constructs data inputs with `richType.defaultValue = getDefaultValue(type)` (e.g. 0 for numbers) but never checks if the block `config` object has a matching key to use as the instance-level `defaultValue`. The engine's `ParseGraphDataConnection` reads `serializationObject.defaultValue` as the instance-level override, but this property was never set.  
**Impact:** Critical — SetDelay blocks always fire with 0ms duration, causing downstream signal chains to execute immediately instead of after the configured delay. In the basketball game, the "throw → wait 4 seconds → reset" flow became "throw → instantly reset", making the ball teleport and sink instead of flying.  
**Fix:** Two-level fix:

1. **flow-graph-mcp-server** (`flowGraphManager.ts`): After building data inputs, iterate config keys and set `defaultValue` on any data input whose name matches a config key.
2. **scene-mcp-server** (`codeGenerator.ts`): Added `_fixupConfigDefaults()` that patches the coordinator JSON before code generation — propagates `block.config[key]` to matching unconnected data inputs as `defaultValue`. This acts as a safety net for pre-existing flow graphs that were serialized before fix (1).

---

## Session 7 — Scene Recreation Gaps

### Gap 35 — `add_material` options don't set material properties

**Server:** scene-mcp-server  
**Status:** 🟡 Unfixed  
**Symptom:** Passing `diffuseColor`, `alpha`, `metallic` etc. in the `options` param of `add_material` does nothing — the material is created with default white. The tool even emits a warning: "No diffuseColor or texture specified".  
**Root cause:** The `options` param on `add_material` is used for mesh-builder-style creation options, not material properties. Material properties require a separate `configure_material` call.  
**Impact:** Low — the LLM must make two calls instead of one. Workaround: call `configure_material` after `add_material`.

### Gap 36 — `add_physics_body` params inside options vs top-level

**Server:** scene-mcp-server  
**Status:** 🟡 Info  
**Symptom:** Passing `bodyType`, `shapeType`, `mass`, `restitution` inside an `options` object fails with "must have required property 'bodyType'". These are top-level params, not nested in options.  
**Impact:** Low — once the correct parameter structure is learned the tool works fine.

### Gap 37 — Gap 21 fix (case-insensitive bodyType) doesn't work at MCP protocol level

**Server:** scene-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** Passing `bodyType: "static"` (lowercase) fails with "must be equal to one of the allowed values" even though Gap 21 added case normalization in the handler. The JSON Schema advertised to the MCP client contains `enum: ["Static","Dynamic","Animated"]`, and the client validates BEFORE the server handler runs.  
**Root cause:** The Zod schema still uses `z.enum(["Static","Dynamic","Animated"])` which generates a strict JSON Schema. The case normalization in the handler never gets a chance to run.  
**Fix:** Changed `z.enum(...)` to `z.string()` so any casing is accepted. The handler's case normalization (Gap 21) now runs.

### Gap 38 — `connect_signal` parameter name mismatch causes wrong port selection

**Server:** flow-graph-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** Using parameter `signalOut` (a natural name) instead of `signalOutputName` causes the signal output to silently default to `"out"`. For blocks with both `out` (fires immediately) and `done` (fires after delay/event), this connects to the WRONG port. The SetDelay block fired immediately instead of after 3 seconds.  
**Root cause:** The `connect_signal` tool's schema defines `signalOutputName` as the parameter name. Zod strips unrecognized `signalOut` parameter, so `signalOutputName` is undefined, and the handler defaults to `"out"`.  
**Fix:** Added `signalOut`, `outName` as aliases for `signalOutputName`, and `signalIn`, `inName`, `inputName` as aliases for `signalInputName`. Changed `signalInputName` from `.default("in")` to `.optional()` so aliases can take precedence.

### Gap 39 — `connect_signal` parameter naming friction

**Server:** flow-graph-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** The `connect_signal` tool uses `signalOutputName` / `signalInputName` as parameter names, but LLMs naturally generate shorter names like `signalOut`, `signalIn`, `outputName`, `inputName`.  
**Fix:** Added aliases: `signalOut`, `outName`, `signalIn`, `inName`, `inputName`.

### Gap 40 — `add_camera` ignores construction options

**Server:** scene-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** `alpha`, `beta`, `radius`, `target` passed via `options` param to `add_camera` are ignored in the generated code. The ArcRotateCamera is constructed with default values.  
**Root cause:** The `add_camera` tool only recognized `properties` (not `options`) for the properties bag. LLMs often use `options` as the param name, which Zod stripped.  
**Fix:** Added `options` as an alias for `properties`. The code generator already reads from `cam.properties` correctly.

### Gap 41 — `add_light` ignores construction options

**Server:** scene-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** `direction`, `intensity` passed via `options` param to `add_light` are ignored. The DirectionalLight gets default direction and intensity.  
**Root cause:** Same as Gap 40 — `options` was not recognized as an alias for `properties`.  
**Fix:** Added `options` as an alias for `properties` in `add_light`.

### Gap 42 — `connect_signal` success message shows raw param name

**Server:** flow-graph-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** After connecting a signal, the success message displayed the raw parameter name (e.g., `signalInputName`) instead of the resolved alias value.  
**Root cause:** The success message template used the original parameter variable instead of the resolved one.  
**Fix:** Changed the message to use `resolvedSignalInputName` instead of `signalInputName`.

### Gap 43 — Physics code generates Cannon.js instead of Havok

**Server:** scene-mcp-server  
**Status:** ✅ Fixed  
**Symptom:** When `set_environment` is called with `physicsEngine: "HavokPhysics"`, the generated code uses `CannonJSPlugin` instead of `HavokPlugin`. The Babylon.js codebase only supports Havok Physics V2.  
**Root cause:** The normalization in `index.ts` did `.toLowerCase().replace("plugin", "")` which turned `"HavokPhysics"` into `"havokphysics"`. The code generator compared `plugin === "havok"` — `"havokphysics" !== "havok"`, so it fell through to the Cannon.js else branch.  
**Fix:** 1) Added `.replace("physics", "")` to the normalization chain so all variants (`"HavokPhysics"`, `"HavokPlugin"`, `"Havok"`, `"havok"`) map to `"havok"`. 2) Made the code generator also normalize the stored value as a safety net. 3) Changed the else branch to also emit Havok code instead of Cannon, since only Havok V2 is supported.

---

## Summary Table

| #      | Gap                                                           | Status             | Category                | Server                 |
| ------ | ------------------------------------------------------------- | ------------------ | ----------------------- | ---------------------- |
| 1      | Silent param stripping (Zod)                                  | ✅ Partially fixed | Tool schema             | scene                  |
| 2      | No configure_material                                         | ✅ Fixed           | Missing tool            | scene                  |
| 3      | NME JSON file support                                         | ✅ Already impl.   | N/A                     | scene                  |
| 4      | No physics FG blocks                                          | ⚠️ Workaround      | Core engine             | flow-graph             |
| 5      | Phantom FG blocks                                             | ✅ Fixed           | Registry                | flow-graph             |
| 6      | No clone FG block                                             | ⚠️ Workaround      | Core engine             | flow-graph             |
| 7      | Cross-server NME ref                                          | ✅ Already impl.   | N/A                     | scene                  |
| 8      | Missing uniqueId                                              | ✅ Fixed           | Code generator          | scene                  |
| 9      | FG JSON as string                                             | ✅ Fixed           | Code generator          | scene                  |
| 10     | coordinatorJsonFile                                           | ✅ Already impl.   | N/A                     | scene                  |
| 11     | Camera/Light aliases                                          | ✅ Fixed           | Tool schema             | scene                  |
| 12     | Batch mesh physics                                            | ✅ Fixed           | Tool schema             | scene                  |
| 13     | Physics param name                                            | ✅ Fixed           | Tool schema             | scene                  |
| 14     | Button text in codegen                                        | ✅ Fixed           | Code generator          | scene                  |
| **15** | **Material type alias**                                       | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **16** | **GUI prop stripping**                                        | **✅ Fixed**       | **Tool schema**         | **gui**                |
| **17** | **GUI name vs controlName**                                   | **✅ Fixed**       | **Tool schema**         | **gui**                |
| **18** | **FG param naming**                                           | **✅ Fixed**       | **Tool schema**         | **flow-graph**         |
| 19     | FG variableName alias                                         | ✅ Fixed           | Config alias            | flow-graph             |
| 20     | FunctionRef config.code                                       | ✅ Fixed           | Code generator          | scene + FG             |
| **21** | **Physics bodyType/shapeType naming**                         | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **22** | **Physics motion type mapping swapped**                       | **✅ Fixed**       | **Code generator**      | **scene**              |
| **23** | **configure_light param wrapping**                            | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **24** | **set_transform nodeId vs meshId**                            | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **25** | **attach_flow_graph param naming**                            | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **26** | **add_camera type vs cameraType**                             | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **27** | **GUI create_gui name vs guiName inconsistency**              | **✅ Fixed**       | **Tool schema**         | **gui**                |
| **28** | **Constant block output named "output" not "value"**          | **✅ Fixed**       | **Block registry**      | **flow-graph**         |
| **29** | **CodeExecution is data block, not execution**                | **🟡 Info**        | **Engine design**       | **flow-graph**         |
| **30** | **collisionCounter integration misleadingly named**           | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **31** | **CodeExecution config.code not injected**                    | **✅ Fixed**       | **Code generator**      | **scene**              |
| **32** | **Event block `out` vs `done` signal wiring**                 | **✅ Fixed**       | **Signal semantics**    | **flow-graph**         |
| **33** | **`attach_flow_graph` duplicates instead of replacing**       | **✅ Fixed**       | **Tool behavior**       | **scene**              |
| **34** | **Config values not propagated to data input defaults**       | **✅ Fixed**       | **Block serialization** | **flow-graph + scene** |
| **35** | **`add_material` options don't set properties**               | **🟡 Unfixed**     | **Tool schema**         | **scene**              |
| **36** | **`add_physics_body` params inside options**                  | **🟡 Info**        | **Tool schema**         | **scene**              |
| **37** | **Gap 21 case normalization blocked by JSON Schema**          | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **38** | **`connect_signal` param name mismatch → wrong port**         | **✅ Fixed**       | **Tool schema**         | **flow-graph**         |
| **39** | **`connect_signal` parameter naming friction**                | **✅ Fixed**       | **Tool schema**         | **flow-graph**         |
| **40** | **`add_camera` ignores construction options**                 | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **41** | **`add_light` ignores construction options**                  | **✅ Fixed**       | **Tool schema**         | **scene**              |
| **42** | **`connect_signal` success message shows raw param**          | **✅ Fixed**       | **Tool display**        | **flow-graph**         |
| **43** | **Physics code generates Cannon.js instead of Havok**         | **✅ Fixed**       | **Code generator**      | **scene**              |
| **44** | **`setBlockConfig` missing config alias normalization**       | **✅ Fixed**       | **Config alias**        | **flow-graph + scene** |
| **45** | **`add_light` param `type` not `lightType`**                  | **✅ Fixed**       | **Param naming**        | **scene**              |
| **46** | **`configure_material` uses `materialId` not `materialName`** | **✅ Fixed**       | **Param naming**        | **scene**              |
| **47** | **`set_transform` param `name` not `meshName`**               | **✅ Fixed**       | **Param naming**        | **scene**              |
| **48** | **`add_physics_body` `meshId`/`bodyType` naming**             | **✅ Fixed**       | **Param naming**        | **scene**              |
| **49** | **GUI Button `buttonText` not `text`**                        | **✅ Fixed**       | **Param naming**        | **gui**                |
| **50** | **`connect_signals_batch` `graphName` position**              | **✅ Fixed**       | **Param structure**     | **flow-graph**         |
