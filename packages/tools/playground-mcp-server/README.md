# @tools/playground-mcp-server

MCP server for AI-driven Babylon.js Playground code editing.

## Provides

- create, list, inspect, and delete in-memory playground documents
- get and set playground code and metadata
- load playgrounds from snippets and local files
- save snippets and local files
- optional live session bridge support for synchronizing with the Playground editor

## Typical Workflow

```text
create_playground -> set_code -> get_code -> save_snippet
```

For editor synchronization workflows, start a session and use the session bridge to keep code in sync with the Playground UI.

## Binary

```bash
babylonjs-playground
```

## Build And Run

```bash
npm run build -w @tools/playground-mcp-server
npm run start -w @tools/playground-mcp-server
```

## Notes

This server focuses on source-code workflows rather than JSON graph serialization. It complements the scene and graph MCP servers when the desired output is authored Babylon.js code.

## Related Files

- `src/index.ts`: MCP tool registration
- `src/playgroundManager.ts`: playground state management
- `src/sessionServer.ts`: live session bridge
