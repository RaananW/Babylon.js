/* eslint-disable @typescript-eslint/naming-convention */
/**
 * PlaygroundManager — in-memory store for playground code.
 *
 * Manages one or more named playground "documents", each with:
 *   - code (the main source text)
 *   - language ("JS" or "TS")
 *   - metadata (title, description, tags)
 *
 * The MCP tools interact with this manager to get/set/modify code.
 */

/**
 * Represents a single playground document with code and metadata.
 */
export interface PlaygroundDocument {
    /** The source code */
    code: string;
    /** "JS" or "TS" */
    language: "JS" | "TS";
    /** Optional title */
    title: string;
    /** Optional description */
    description: string;
    /** Optional tags */
    tags: string;
}

/**
 * In-memory store for playground documents. The MCP tools interact
 * with this manager to get/set/modify code.
 */
export class PlaygroundManager {
    private _documents = new Map<string, PlaygroundDocument>();

    /**
     * Create a new playground document.
     * @param name - Unique name for this playground.
     * @param language - "JS" or "TS" (default: "JS").
     * @param code - Initial code (default: empty starter template).
     * @returns The created document name, or an error string.
     */
    public createPlayground(name: string, language: "JS" | "TS" = "JS", code?: string): string | "OK" {
        if (this._documents.has(name)) {
            return `Playground "${name}" already exists. Use a different name or delete it first.`;
        }
        const defaultCode =
            language === "TS"
                ? `export const createScene = function (): BABYLON.Scene {\n    const scene = new BABYLON.Scene(engine);\n    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);\n    camera.setTarget(BABYLON.Vector3.Zero());\n    camera.attachControl(canvas, true);\n    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);\n    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);\n    sphere.position.y = 1;\n    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);\n    return scene;\n};\n`
                : `export const createScene = function () {\n    const scene = new BABYLON.Scene(engine);\n    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);\n    camera.setTarget(BABYLON.Vector3.Zero());\n    camera.attachControl(canvas, true);\n    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);\n    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);\n    sphere.position.y = 1;\n    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);\n    return scene;\n};\n`;

        this._documents.set(name, {
            code: code ?? defaultCode,
            language,
            title: name,
            description: "",
            tags: "",
        });
        return "OK";
    }

    /**
     * List all playground document names.
     * @returns Array of playground names.
     */
    public listPlaygrounds(): string[] {
        return [...this._documents.keys()];
    }

    /**
     * Get a playground document by name.
     * @param name - The playground name.
     * @returns The document, or undefined if not found.
     */
    public getPlayground(name: string): PlaygroundDocument | undefined {
        return this._documents.get(name);
    }

    /**
     * Get the code of a playground.
     * @param name - The playground name.
     * @returns The code string, or undefined if not found.
     */
    public getCode(name: string): string | undefined {
        return this._documents.get(name)?.code;
    }

    /**
     * Set (replace) the entire code of a playground.
     * @param name - The playground name.
     * @param code - The new code.
     * @returns "OK" or an error string.
     */
    public setCode(name: string, code: string): string | "OK" {
        const doc = this._documents.get(name);
        if (!doc) {
            return `Playground "${name}" not found.`;
        }
        doc.code = code;
        return "OK";
    }

    /**
     * Set metadata (title, description, tags) on a playground.
     * @param name - The playground name.
     * @param metadata - Object with optional title, description, tags.
     * @returns "OK" or an error string.
     */
    public setMetadata(name: string, metadata: { title?: string; description?: string; tags?: string }): string | "OK" {
        const doc = this._documents.get(name);
        if (!doc) {
            return `Playground "${name}" not found.`;
        }
        if (metadata.title !== undefined) {
            doc.title = metadata.title;
        }
        if (metadata.description !== undefined) {
            doc.description = metadata.description;
        }
        if (metadata.tags !== undefined) {
            doc.tags = metadata.tags;
        }
        return "OK";
    }

    /**
     * Delete a playground.
     * @param name - The playground name.
     * @returns "OK" or an error string.
     */
    public deletePlayground(name: string): string | "OK" {
        if (!this._documents.has(name)) {
            return `Playground "${name}" not found.`;
        }
        this._documents.delete(name);
        return "OK";
    }

    /**
     * Rename a playground.
     * @param oldName - Current name.
     * @param newName - New name.
     * @returns "OK" or an error string.
     */
    public renamePlayground(oldName: string, newName: string): string | "OK" {
        const doc = this._documents.get(oldName);
        if (!doc) {
            return `Playground "${oldName}" not found.`;
        }
        if (this._documents.has(newName)) {
            return `Playground "${newName}" already exists.`;
        }
        this._documents.delete(oldName);
        this._documents.set(newName, doc);
        return "OK";
    }

    /**
     * Export the playground as a JSON object suitable for the playground snippet format.
     * @param name - The playground name.
     * @returns JSON string, or undefined if not found.
     */
    public exportJSON(name: string): string | undefined {
        const doc = this._documents.get(name);
        if (!doc) {
            return undefined;
        }
        return JSON.stringify({
            code: doc.code,
            language: doc.language,
            title: doc.title,
            description: doc.description,
            tags: doc.tags,
        });
    }

    /**
     * Import playground state from a JSON string.
     * @param name - The playground name (creates if doesn't exist, replaces if it does).
     * @param json - JSON string with code, language, etc.
     * @returns "OK" or an error string.
     */
    public importJSON(name: string, json: string): string | "OK" {
        try {
            const data = JSON.parse(json);
            const code = typeof data.code === "string" ? data.code : "";
            const language = data.language === "TS" ? "TS" : "JS";
            this._documents.set(name, {
                code,
                language: language as "JS" | "TS",
                title: typeof data.title === "string" ? data.title : name,
                description: typeof data.description === "string" ? data.description : "",
                tags: typeof data.tags === "string" ? data.tags : "",
            });
            return "OK";
        } catch {
            return "Invalid JSON";
        }
    }
}
