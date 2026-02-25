#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * GUI MCP Server
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * GUI layouts (AdvancedDynamicTexture / 2D controls) programmatically.
 *
 * An AI agent (or any MCP client) can:
 *   • Create / manage GUI textures (AdvancedDynamicTexture)
 *   • Add any GUI control (TextBlock, Button, Slider, Grid, etc.)
 *   • Build hierarchical control trees
 *   • Configure Grid rows / columns
 *   • Set control properties
 *   • Reparent controls
 *   • Validate the GUI layout
 *   • Export GUI JSON (loadable via AdvancedDynamicTexture.parseSerializedObject)
 *   • Import existing GUI JSON for editing
 *
 * Transport: stdio
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { ControlRegistry, BaseControlProperties, GetControlCatalogSummary, GetControlTypeDetails } from "./catalog.js";
import { GuiManager } from "./guiManager.js";

// ─── Singleton manager ────────────────────────────────────────────────────
const manager = new GuiManager();

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer({
    name: "babylonjs-gui",
    version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.resource("control-catalog", "gui://control-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# GUI Control Catalog\n${GetControlCatalogSummary()}`,
        },
    ],
}));

server.resource("base-properties", "gui://base-properties", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Base Control Properties",
                "These properties are available on ALL controls:\n",
                ...Object.entries(BaseControlProperties).map(([k, v]) => `• **${k}** (${v.type}): ${v.description}`),
            ].join("\n"),
        },
    ],
}));

server.resource("enums", "gui://enums", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# GUI Enumerations Reference",
                "",
                "## Horizontal Alignment",
                "LEFT (0), RIGHT (1), CENTER (2)",
                "",
                "## Vertical Alignment",
                "TOP (0), BOTTOM (1), CENTER (2)",
                "",
                "## Text Wrapping",
                "Clip (0), WordWrap (1), Ellipsis (2), WordWrapEllipsis (3), HTML (4)",
                "",
                "## Image Stretch",
                "STRETCH_NONE (0), STRETCH_FILL (1), STRETCH_UNIFORM (2), STRETCH_EXTEND (3), STRETCH_NINE_PATCH (4)",
                "",
                "## Grid Definition Units",
                "Fraction (0) — value is 0–1 ratio, Pixel (1) — value is in pixels",
                "",
                "## Size Strings",
                'Width/height accept: "200px" (pixels), "50%" (percentage), "0.5" (fraction), or a number',
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.prompt("create-hud", "Step-by-step instructions for building a basic game HUD", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a game HUD with health bar, score, and minimap placeholder. Steps:",
                    "1. create_gui 'GameHUD' (fullscreen, 1920×1080)",
                    "2. Add a Grid 'mainGrid' as the layout root, parent 'root'",
                    "3. Add 3 rows to the grid: 0.1 (top bar), 0.8 (main area), 0.1 (bottom bar)",
                    "4. Add 3 columns: 0.25 (left), 0.5 (center), 0.25 (right)",
                    "5. Top-left: Add Rectangle 'healthBarBg' (cell 0,0), background '#333', cornerRadius 10",
                    "6. Inside healthBarBg: Add Rectangle 'healthBarFill', background '#00ff00', width '80%', height '60%', horizontalAlignment 0",
                    "7. Top-center: Add TextBlock 'scoreText' (cell 0,1), text 'Score: 0', fontSize '32px', color 'white'",
                    "8. Top-right: Add Rectangle 'minimapBg' (cell 0,2), background '#222', cornerRadius 5",
                    "9. Bottom-center: Add StackPanel 'bottomBar' (cell 2,1), isVertical false, spacing 20",
                    "10. Inside bottomBar: Add Button 'inventoryBtn' with buttonText 'Inventory'",
                    "11. Inside bottomBar: Add Button 'menuBtn' with buttonText 'Menu'",
                    "12. validate_gui, then export_gui_json",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-menu", "Step-by-step instructions for building a settings/options menu", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a settings menu panel with controls. Steps:",
                    "1. create_gui 'SettingsMenu' (fullscreen, 1920×1080)",
                    "2. Add Rectangle 'panel' to root, width '400px', height '600px', background '#1a1a2e', cornerRadius 20, thickness 2, color '#e94560'",
                    "3. Add TextBlock 'title' to panel, text 'Settings', fontSize '36px', color 'white', height '60px', verticalAlignment 0",
                    "4. Add StackPanel 'settingsList' to panel, isVertical true, spacing 15, top '80px', height '450px', width '80%'",
                    "5. Add a StackPanel 'volumeRow' to settingsList, isVertical false, height '40px'",
                    "6. Inside volumeRow: TextBlock 'volumeLabel', text 'Volume', width '40%', color 'white', textHorizontalAlignment 0",
                    "7. Inside volumeRow: Slider 'volumeSlider', width '60%', minimum 0, maximum 100, value 75, color '#e94560'",
                    "8. Repeat for 'Brightness' and 'FOV' sliders",
                    "9. Add Checkbox row: StackPanel 'fullscreenRow', with TextBlock 'Fullscreen' + Checkbox",
                    "10. Add Button 'applyBtn' to panel, buttonText 'Apply', background '#e94560', height '50px', width '60%', verticalAlignment 1, top '-30px'",
                    "11. validate_gui, then export_gui_json",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-dialog", "Step-by-step instructions for building a modal dialog", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a confirmation dialog. Steps:",
                    "1. create_gui 'ConfirmDialog' (fullscreen, 1920×1080)",
                    "2. Add Rectangle 'overlay' to root, width '100%', height '100%', background 'rgba(0,0,0,0.5)', thickness 0",
                    "3. Add Rectangle 'dialog' to overlay, width '400px', height '200px', background '#ffffff', cornerRadius 12, thickness 0",
                    "4. Add TextBlock 'title' to dialog, text 'Confirm', fontSize '24px', color '#333', height '50px', verticalAlignment 0",
                    "5. Add TextBlock 'message' to dialog, text 'Are you sure?', color '#666', textWrapping 1",
                    "6. Add StackPanel 'buttons' to dialog, isVertical false, spacing 20, height '50px', verticalAlignment 1, top '-20px'",
                    "7. Add Button 'cancelBtn' to buttons, buttonText 'Cancel', width '120px', background '#ccc', color '#333'",
                    "8. Add Button 'confirmBtn' to buttons, buttonText 'Confirm', width '120px', background '#4CAF50', color 'white'",
                    "9. validate_gui, export_gui_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── GUI Texture lifecycle ─────────────────────────────────────────────

server.tool(
    "create_gui",
    "Create a new empty GUI (AdvancedDynamicTexture) in memory. This is always the first step. " +
        "The GUI starts with an empty root container; add controls to 'root' to begin building.",
    {
        name: z.string().describe("Unique name for this GUI (e.g. 'MainHUD', 'SettingsPanel')"),
        width: z.number().default(1920).describe("Texture width in pixels"),
        height: z.number().default(1080).describe("Texture height in pixels"),
        isFullscreen: z.boolean().default(true).describe("Whether this is a fullscreen overlay GUI"),
        idealWidth: z.number().optional().describe("Ideal width for adaptive scaling (optional)"),
        idealHeight: z.number().optional().describe("Ideal height for adaptive scaling (optional)"),
    },
    async ({ name, width, height, isFullscreen, idealWidth, idealHeight }) => {
        manager.createTexture(name, { width, height, isFullscreen, idealWidth, idealHeight });
        return {
            content: [
                {
                    type: "text",
                    text: `Created GUI "${name}" (${width}×${height}, fullscreen: ${isFullscreen}). The root container is named "root". Add controls to it with add_control.`,
                },
            ],
        };
    }
);

server.tool("delete_gui", "Delete a GUI texture from memory.", { name: z.string().describe("Name of the GUI to delete") }, async ({ name }) => {
    const ok = manager.deleteTexture(name);
    return { content: [{ type: "text", text: ok ? `Deleted "${name}".` : `GUI "${name}" not found.` }] };
});

server.tool("list_guis", "List all GUI textures currently in memory.", {}, async () => {
    const names = manager.listTextures();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `GUIs in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No GUIs in memory.",
            },
        ],
    };
});

// ── Control operations ────────────────────────────────────────────────

server.tool(
    "add_control",
    "Add a new GUI control to a GUI texture. Returns the control's name for use in further operations. " +
        "The control is added as a child of the specified parent (defaults to 'root'). " +
        "For Grid parents, you can specify gridRow and gridColumn to place the control in a specific cell.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        controlType: z
            .string()
            .describe(
                "The control type from the catalog (e.g. 'TextBlock', 'Rectangle', 'Button', 'Slider', 'Grid', 'StackPanel'). " +
                    "Use list_control_types to see all available types."
            ),
        controlName: z.string().optional().describe("Name for the control (must be unique within the GUI). Auto-generated if omitted."),
        parentName: z.string().default("root").describe("Name of the parent container to add this control to. Defaults to 'root'."),
        properties: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                "Key-value properties to set on the control. Examples: " +
                    '{ text: "Hello", fontSize: "24px", color: "white" } for TextBlock, ' +
                    '{ background: "#333", cornerRadius: 10, thickness: 2 } for Rectangle, ' +
                    "{ minimum: 0, maximum: 100, value: 50 } for Slider, " +
                    '{ buttonText: "Click me", background: "#4CAF50" } for Button (buttonText creates the internal TextBlock), ' +
                    '{ buttonImage: "icon.png" } for Button with image.'
            ),
        gridRow: z.number().optional().describe("Row index when adding to a Grid parent (0-based)"),
        gridColumn: z.number().optional().describe("Column index when adding to a Grid parent (0-based)"),
    },
    async ({ guiName, controlType, controlName, parentName, properties, gridRow, gridColumn }) => {
        const result = manager.addControl(guiName, controlType, controlName, parentName, properties as Record<string, unknown>, gridRow, gridColumn);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const cellInfo = gridRow !== undefined || gridColumn !== undefined ? ` in cell [${gridRow ?? 0}, ${gridColumn ?? 0}]` : "";
        return {
            content: [
                {
                    type: "text",
                    text: `Added ${controlType} "${result.name}" to "${parentName}"${cellInfo}. Use "${result.name}" to reference this control.`,
                },
            ],
        };
    }
);

server.tool(
    "remove_control",
    "Remove a control (and all its descendants) from the GUI.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        controlName: z.string().describe("Name of the control to remove"),
    },
    async ({ guiName, controlName }) => {
        const result = manager.removeControl(guiName, controlName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed "${controlName}" and all its children.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_control_properties",
    "Set or update properties on an existing control.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        controlName: z.string().describe("Name of the control to modify"),
        properties: z
            .record(z.string(), z.unknown())
            .describe(
                "Key-value properties to set. Any base Control property (width, height, color, fontSize, etc.) " +
                    "or type-specific property (text, source, isChecked, minimum, maximum, etc.). " +
                    "For Buttons, use 'buttonText' to update the internal TextBlock's text."
            ),
    },
    async ({ guiName, controlName, properties }) => {
        const result = manager.setControlProperties(guiName, controlName, properties as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated "${controlName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "reparent_control",
    "Move a control to a different parent container.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        controlName: z.string().describe("Name of the control to move"),
        newParentName: z.string().describe("Name of the new parent container"),
        gridRow: z.number().optional().describe("Row index if new parent is a Grid"),
        gridColumn: z.number().optional().describe("Column index if new parent is a Grid"),
    },
    async ({ guiName, controlName, newParentName, gridRow, gridColumn }) => {
        const result = manager.reparentControl(guiName, controlName, newParentName, gridRow, gridColumn);
        const cellInfo = gridRow !== undefined || gridColumn !== undefined ? ` in cell [${gridRow ?? 0}, ${gridColumn ?? 0}]` : "";
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Moved "${controlName}" to "${newParentName}"${cellInfo}.` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

// ── Grid operations ───────────────────────────────────────────────────

server.tool(
    "add_grid_row",
    "Add a row definition to a Grid control. Call this before placing controls in that row.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        value: z.number().describe("Size value — fraction (0–1) if isPixel=false, or pixel count if isPixel=true"),
        isPixel: z.boolean().default(false).describe("Whether the value is in pixels (true) or a fraction (false)"),
    },
    async ({ guiName, gridName, value, isPixel }) => {
        const result = manager.addGridRow(guiName, gridName, value, isPixel);
        const unitStr = isPixel ? `${value}px` : `${value} (fraction)`;
        return {
            content: [{ type: "text", text: result === "OK" ? `Added row (${unitStr}) to Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "add_grid_column",
    "Add a column definition to a Grid control.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        value: z.number().describe("Size value — fraction (0–1) if isPixel=false, or pixel count if isPixel=true"),
        isPixel: z.boolean().default(false).describe("Whether the value is in pixels (true) or a fraction (false)"),
    },
    async ({ guiName, gridName, value, isPixel }) => {
        const result = manager.addGridColumn(guiName, gridName, value, isPixel);
        const unitStr = isPixel ? `${value}px` : `${value} (fraction)`;
        return {
            content: [{ type: "text", text: result === "OK" ? `Added column (${unitStr}) to Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_grid_row",
    "Update an existing row definition on a Grid.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        index: z.number().describe("Row index (0-based)"),
        value: z.number().describe("New size value"),
        isPixel: z.boolean().default(false).describe("Whether the value is in pixels"),
    },
    async ({ guiName, gridName, index, value, isPixel }) => {
        const result = manager.setGridRow(guiName, gridName, index, value, isPixel);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated row ${index} on Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_grid_column",
    "Update an existing column definition on a Grid.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        index: z.number().describe("Column index (0-based)"),
        value: z.number().describe("New size value"),
        isPixel: z.boolean().default(false).describe("Whether the value is in pixels"),
    },
    async ({ guiName, gridName, index, value, isPixel }) => {
        const result = manager.setGridColumn(guiName, gridName, index, value, isPixel);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated column ${index} on Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "remove_grid_row",
    "Remove a row definition from a Grid.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        index: z.number().describe("Row index to remove (0-based)"),
    },
    async ({ guiName, gridName, index }) => {
        const result = manager.removeGridRow(guiName, gridName, index);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed row ${index} from Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "remove_grid_column",
    "Remove a column definition from a Grid.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        index: z.number().describe("Column index to remove (0-based)"),
    },
    async ({ guiName, gridName, index }) => {
        const result = manager.removeGridColumn(guiName, gridName, index);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed column ${index} from Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ───────────────────────────────────────────────────────

server.tool(
    "describe_gui",
    "Get a human-readable description of the GUI, including the full control tree with properties.",
    {
        guiName: z.string().describe("Name of the GUI texture to describe"),
    },
    async ({ guiName }) => {
        const desc = manager.describeTexture(guiName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "describe_control",
    "Get detailed information about a specific control, including its properties, parent, and children.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        controlName: z.string().describe("Name of the control to describe"),
    },
    async ({ guiName, controlName }) => {
        const desc = manager.describeControl(guiName, controlName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "list_control_types",
    "List all available GUI control types, grouped by category.",
    {
        category: z.string().optional().describe("Optionally filter by category (Container, Layout, Text, Input, Button, Indicator, Shape, Image, Misc)"),
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(ControlRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key}: ${info.description.split(".")[0]}`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: matching.length > 0 ? `## ${category} Controls\n${matching}` : `No controls found in category "${category}".`,
                    },
                ],
            };
        }
        return { content: [{ type: "text", text: GetControlCatalogSummary() }] };
    }
);

server.tool(
    "get_control_type_info",
    "Get detailed info about a specific control type — its properties, whether it's a container, and description.",
    {
        controlType: z.string().describe("The control type name (e.g. 'TextBlock', 'Grid', 'Slider')"),
    },
    async ({ controlType }) => {
        const info = GetControlTypeDetails(controlType);
        if (!info) {
            return {
                content: [{ type: "text", text: `Control type "${controlType}" not found. Use list_control_types to see available types.` }],
                isError: true,
            };
        }

        const lines: string[] = [];
        lines.push(`## ${controlType}`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Container: ${info.isContainer ? "Yes (can hold children)" : "No (leaf control)"}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Type-Specific Properties:");
        if (Object.keys(info.properties).length === 0) {
            lines.push("  (none beyond base properties)");
        }
        for (const [k, v] of Object.entries(info.properties)) {
            const def = v.defaultValue !== undefined ? ` [default: ${JSON.stringify(v.defaultValue)}]` : "";
            lines.push(`  • ${k} (${v.type}): ${v.description}${def}`);
        }

        lines.push("\n### Base Properties (available on all controls):");
        lines.push("  width, height, left, top, color, alpha, fontSize, fontFamily, fontWeight,");
        lines.push("  horizontalAlignment, verticalAlignment, paddingLeft/Right/Top/Bottom,");
        lines.push("  isVisible, isEnabled, zIndex, rotation, scaleX, scaleY, shadow*, clipChildren, clipContent");

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Validation ────────────────────────────────────────────────────────

server.tool(
    "validate_gui",
    "Run validation checks on a GUI. Reports issues like empty containers, invalid Grid cell assignments, and duplicates.",
    {
        guiName: z.string().describe("Name of the GUI to validate"),
    },
    async ({ guiName }) => {
        const issues = manager.validateTexture(guiName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ───────────────────────────────────────────────────

server.tool(
    "export_gui_json",
    "Export the GUI as Babylon.js-compatible JSON. This JSON can be loaded with " +
        "AdvancedDynamicTexture.parseSerializedObject() or AdvancedDynamicTexture.ParseFromFileAsync().",
    {
        guiName: z.string().describe("Name of the GUI to export"),
    },
    async ({ guiName }) => {
        const json = manager.exportJSON(guiName);
        if (!json) {
            return { content: [{ type: "text", text: `GUI "${guiName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.tool(
    "import_gui_json",
    "Import existing GUI JSON into memory for editing. You can then modify controls, rearrange hierarchy, etc.",
    {
        guiName: z.string().describe("Name to give the imported GUI"),
        json: z.string().describe("The Babylon.js GUI JSON string to import"),
    },
    async ({ guiName, json }) => {
        const result = manager.importJSON(guiName, json);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const desc = manager.describeTexture(guiName);
        return { content: [{ type: "text", text: `Imported successfully.\n\n${desc}` }] };
    }
);

// ── Batch operations ──────────────────────────────────────────────────

server.tool(
    "add_controls_batch",
    "Add multiple controls at once. More efficient than calling add_control repeatedly.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        controls: z
            .array(
                z.object({
                    controlType: z.string().describe("Control type name"),
                    controlName: z.string().optional().describe("Name for the control"),
                    parentName: z.string().default("root").describe("Parent container name"),
                    properties: z.record(z.string(), z.unknown()).optional().describe("Control properties"),
                    gridRow: z.number().optional().describe("Grid row index"),
                    gridColumn: z.number().optional().describe("Grid column index"),
                })
            )
            .describe("Array of controls to add"),
    },
    async ({ guiName, controls }) => {
        const results: string[] = [];
        for (const def of controls) {
            const result = manager.addControl(guiName, def.controlType, def.controlName, def.parentName, def.properties as Record<string, unknown>, def.gridRow, def.gridColumn);
            if (typeof result === "string") {
                results.push(`Error adding ${def.controlType}: ${result}`);
            } else {
                results.push(`"${result.name}" (${def.controlType}) → "${def.parentName}"`);
            }
        }
        return { content: [{ type: "text", text: `Added controls:\n${results.join("\n")}` }] };
    }
);

server.tool(
    "setup_grid",
    "Configure a Grid all at once: add multiple row and column definitions in a single call.",
    {
        guiName: z.string().describe("Name of the GUI texture"),
        gridName: z.string().describe("Name of the Grid control"),
        rows: z
            .array(
                z.object({
                    value: z.number().describe("Size value"),
                    isPixel: z.boolean().default(false).describe("Pixel (true) or fraction (false)"),
                })
            )
            .describe("Array of row definitions"),
        columns: z
            .array(
                z.object({
                    value: z.number().describe("Size value"),
                    isPixel: z.boolean().default(false).describe("Pixel (true) or fraction (false)"),
                })
            )
            .describe("Array of column definitions"),
    },
    async ({ guiName, gridName, rows, columns }) => {
        const results: string[] = [];
        for (const row of rows) {
            const r = manager.addGridRow(guiName, gridName, row.value, row.isPixel);
            if (r !== "OK") {
                results.push(`Row error: ${r}`);
            }
        }
        for (const col of columns) {
            const c = manager.addGridColumn(guiName, gridName, col.value, col.isPixel);
            if (c !== "OK") {
                results.push(`Column error: ${c}`);
            }
        }

        if (results.length > 0) {
            return { content: [{ type: "text", text: `Errors:\n${results.join("\n")}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Configured Grid "${gridName}": ${rows.length} rows, ${columns.length} columns.`,
                },
            ],
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js GUI MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}
