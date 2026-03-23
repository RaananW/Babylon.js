# @tools/scene-mcp-server

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
- Node Render Graph JSON from `node-render-graph-mcp-server`

## Related Files

- `src/index.ts`: MCP tool registration
- `src/sceneManager.ts`: scene-state orchestration
- `src/codeGenerator.ts`: code and project export logic
- `src/previewServer.ts`: local preview support
