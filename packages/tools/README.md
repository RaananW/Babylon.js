# Babylon.js MCP Tools

This directory contains the Babylon.js Model Context Protocol tooling packages used to expose Babylon.js authoring workflows to MCP-compatible clients.

## Packages

| Package                        | Purpose                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `mcpServerCore`                | Shared internal helpers for MCP response shaping, schema fragments, validation, and file handoff behavior. |
| `nme-mcp-server`               | Node Material graph authoring and import/export workflows.                                                 |
| `flow-graph-mcp-server`        | Flow Graph authoring and coordinator JSON export/import workflows.                                         |
| `gui-mcp-server`               | Babylon.js GUI authoring, layout, export/import, and snippet flows.                                        |
| `nge-mcp-server`               | Node Geometry graph authoring and export/import workflows.                                                 |
| `node-render-graph-mcp-server` | Node Render Graph authoring and render-pipeline export/import workflows.                                   |
| `npe-mcp-server`               | Node Particle graph authoring and export/import workflows.                                                 |
| `scene-mcp-server`             | Scene orchestration, integration, code export, and preview workflows.                                      |
| `playground-mcp-server`        | Babylon.js Playground code editing and live-session workflows.                                             |

## How The Packages Fit Together

The MCP packages are organized around two usage patterns:

- specialized graph or authoring servers that manage one Babylon.js subsystem in memory
- an orchestration server that consumes exported data from the specialized servers and produces runnable scenes or projects

The main integration path looks like this:

```text
Node Material MCP        -> Scene MCP via nmeJson / nmeJsonFile
Flow Graph MCP          -> Scene MCP via coordinatorJson / coordinatorJsonFile
GUI MCP                 -> Scene MCP via guiJson / guiJsonFile
Node Geometry MCP       -> Scene MCP via ngeJson / ngeJsonFile
Node Render Graph MCP   -> Scene MCP via nrgJson / nrgJsonFile
Playground MCP          -> standalone code workflow
```

## Typical Cross-Server Workflow

When a graph is large, the intended handoff is file-based rather than inline JSON in the conversation:

```text
1. Build a graph in a specialized MCP server
2. Export it with outputFile
3. Pass the resulting file path into Scene MCP using the matching *File input
4. Export code, a project, or a preview from Scene MCP
```

Example:

```text
export_material_json { materialName, outputFile }
add_material { sceneName, type: "NodeMaterial", nmeJsonFile }
export_scene_code { sceneName }
```

## Common Development Flow

Most MCP server packages in this folder support the same development commands:

```bash
npm run build -w @tools/<package-name>
npm run start -w @tools/<package-name>
```

The MCP servers are built with Rollup and consume the shared helpers from `@tools/mcp-server-core`.

## Shared Conventions

- JSON export tools generally support `outputFile`
- JSON import tools generally support `json` and `jsonFile`
- snippet-enabled servers generally support `snippetId`
- shared schema, validation, and response helpers live in `mcpServerCore`

## Workspace MCP Configuration

The workspace-level MCP server command mapping lives in `.vscode/mcp.json` at the repository root. That file is useful when testing the servers locally from VS Code or another MCP-aware client.
