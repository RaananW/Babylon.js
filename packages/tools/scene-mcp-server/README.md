# @tools/scene-mcp-server

> **⚠️ HIGHLY EXPERIMENTAL — USE WITH CAUTION**
>
> This MCP server is an early-stage prototype and should **not** be relied upon for production workflows.
> It is included in this PR for exploration and feedback purposes only.
>
> **Known limitations:**
>
> - Generated scene code may contain errors or require manual correction.
> - Cross-server integration (consuming NME, Flow Graph, GUI, NGE, NRGE JSON) works for simple cases but may fail on complex compositions.
> - Physics, animations, and particle sub-systems have incomplete coverage.
> - The preview server is basic and may not reflect all scene features.
> - Many convenience aliases have been added to reduce silent parameter stripping (see `KNOWN_GAPS.md`), but agents may still hit undiscovered edge cases.
> - Scene validation catches common problems but is not exhaustive.
>
> For details on known issues and workarounds, see [`KNOWN_GAPS.md`](./KNOWN_GAPS.md).
>
> The other graph-oriented MCP servers (NME, NGE, NPE, Flow Graph, GUI, NRGE, glTF, Smart Filters) are more mature and suitable for regular use.

MCP server for AI-driven Babylon.js scene orchestration.

## Provides

- scene lifecycle and scene-state management
- cameras, lights, meshes, materials, textures, audio, particles, and physics workflows
- integration of exported JSON from other Babylon.js MCP servers
- scene validation and inspection tools
- export as raw scene JSON, runnable code, or full project output
- live preview support

## Typical Workflow

```text
create_scene -> add camera/light/meshes -> attach optional subsystem JSON -> validate_scene -> export_scene_code or export_scene_project
```

This is the package that ties the graph-oriented servers together into a runnable Babylon.js scene.

## Binary

```bash
babylonjs-scene
```

## Build And Run

```bash
npm run build -w @tools/scene-mcp-server
npm run start -w @tools/scene-mcp-server
```

## Integration

This server acts as the orchestrator for the MCP toolchain. It can consume:

- Node Material JSON from `nme-mcp-server`
- Flow Graph coordinator JSON from `flow-graph-mcp-server`
- GUI JSON from `gui-mcp-server`
- Node Geometry JSON from `nge-mcp-server`
- Node Render Graph JSON from `nrge-mcp-server`

## Related Files

- `src/index.ts`: MCP tool registration
- `src/sceneManager.ts`: scene-state orchestration
- `src/codeGenerator.ts`: code and project export logic
- `src/previewServer.ts`: local preview support
