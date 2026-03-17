/**
 * Playground MCP Server – PlaygroundManager unit tests.
 *
 * Validates the in-memory playground document store: create, read, update,
 * delete, rename, export/import JSON, and default template generation.
 *
 * Run with: npx jest --testPathPattern playground-mcp-server
 */

import { PlaygroundManager } from "../../src/playgroundManager";

describe("PlaygroundManager", () => {
    let mgr: PlaygroundManager;

    beforeEach(() => {
        mgr = new PlaygroundManager();
    });

    // ── Create ────────────────────────────────────────────────────────────

    describe("createPlayground", () => {
        it("creates a JS playground with default template", () => {
            expect(mgr.createPlayground("test1")).toBe("OK");
            const doc = mgr.getPlayground("test1");
            expect(doc).toBeDefined();
            expect(doc!.language).toBe("JS");
            expect(doc!.code).toContain("export const createScene");
            expect(doc!.code).toContain("BABYLON.Scene");
            expect(doc!.title).toBe("test1");
            expect(doc!.description).toBe("");
            expect(doc!.tags).toBe("");
        });

        it("creates a TS playground with default template", () => {
            expect(mgr.createPlayground("tsTest", "TS")).toBe("OK");
            const doc = mgr.getPlayground("tsTest");
            expect(doc).toBeDefined();
            expect(doc!.language).toBe("TS");
            expect(doc!.code).toContain("export const createScene");
            expect(doc!.code).toContain(": BABYLON.Scene");
        });

        it("creates a playground with custom code", () => {
            const code = "export const createScene = function () { return new BABYLON.Scene(engine); };";
            expect(mgr.createPlayground("custom", "JS", code)).toBe("OK");
            expect(mgr.getCode("custom")).toBe(code);
        });

        it("rejects duplicate names", () => {
            mgr.createPlayground("dup");
            const result = mgr.createPlayground("dup");
            expect(result).not.toBe("OK");
            expect(result).toContain("already exists");
        });

        it("default templates include export keyword", () => {
            mgr.createPlayground("js", "JS");
            mgr.createPlayground("ts", "TS");
            expect(mgr.getCode("js")).toMatch(/^export const createScene/);
            expect(mgr.getCode("ts")).toMatch(/^export const createScene/);
        });
    });

    // ── List ──────────────────────────────────────────────────────────────

    describe("listPlaygrounds", () => {
        it("returns empty array when no playgrounds exist", () => {
            expect(mgr.listPlaygrounds()).toEqual([]);
        });

        it("returns all playground names", () => {
            mgr.createPlayground("a");
            mgr.createPlayground("b");
            mgr.createPlayground("c");
            expect(mgr.listPlaygrounds()).toEqual(["a", "b", "c"]);
        });
    });

    // ── Get ───────────────────────────────────────────────────────────────

    describe("getPlayground / getCode", () => {
        it("returns undefined for non-existent playground", () => {
            expect(mgr.getPlayground("nope")).toBeUndefined();
            expect(mgr.getCode("nope")).toBeUndefined();
        });

        it("returns the document and code for existing playground", () => {
            mgr.createPlayground("x", "JS", "// hello");
            expect(mgr.getPlayground("x")).toBeDefined();
            expect(mgr.getCode("x")).toBe("// hello");
        });
    });

    // ── Set code ──────────────────────────────────────────────────────────

    describe("setCode", () => {
        it("replaces the code", () => {
            mgr.createPlayground("pg");
            expect(mgr.setCode("pg", "// new code")).toBe("OK");
            expect(mgr.getCode("pg")).toBe("// new code");
        });

        it("returns error for non-existent playground", () => {
            const result = mgr.setCode("missing", "code");
            expect(result).not.toBe("OK");
            expect(result).toContain("not found");
        });
    });

    // ── Metadata ──────────────────────────────────────────────────────────

    describe("setMetadata", () => {
        it("updates title, description, and tags", () => {
            mgr.createPlayground("meta");
            expect(mgr.setMetadata("meta", { title: "My PG", description: "A demo", tags: "demo,test" })).toBe("OK");
            const doc = mgr.getPlayground("meta")!;
            expect(doc.title).toBe("My PG");
            expect(doc.description).toBe("A demo");
            expect(doc.tags).toBe("demo,test");
        });

        it("supports partial updates", () => {
            mgr.createPlayground("partial");
            mgr.setMetadata("partial", { title: "Original" });
            mgr.setMetadata("partial", { description: "Added later" });
            const doc = mgr.getPlayground("partial")!;
            expect(doc.title).toBe("Original");
            expect(doc.description).toBe("Added later");
        });

        it("returns error for non-existent playground", () => {
            const result = mgr.setMetadata("nope", { title: "x" });
            expect(result).not.toBe("OK");
            expect(result).toContain("not found");
        });
    });

    // ── Delete ────────────────────────────────────────────────────────────

    describe("deletePlayground", () => {
        it("deletes an existing playground", () => {
            mgr.createPlayground("del");
            expect(mgr.deletePlayground("del")).toBe("OK");
            expect(mgr.getPlayground("del")).toBeUndefined();
            expect(mgr.listPlaygrounds()).toEqual([]);
        });

        it("returns error for non-existent playground", () => {
            const result = mgr.deletePlayground("nope");
            expect(result).not.toBe("OK");
            expect(result).toContain("not found");
        });
    });

    // ── Rename ────────────────────────────────────────────────────────────

    describe("renamePlayground", () => {
        it("renames a playground", () => {
            mgr.createPlayground("old", "JS", "// code");
            expect(mgr.renamePlayground("old", "new")).toBe("OK");
            expect(mgr.getPlayground("old")).toBeUndefined();
            expect(mgr.getCode("new")).toBe("// code");
        });

        it("returns error when source doesn't exist", () => {
            const result = mgr.renamePlayground("nope", "new");
            expect(result).not.toBe("OK");
            expect(result).toContain("not found");
        });

        it("returns error when target name is taken", () => {
            mgr.createPlayground("a");
            mgr.createPlayground("b");
            const result = mgr.renamePlayground("a", "b");
            expect(result).not.toBe("OK");
            expect(result).toContain("already exists");
        });
    });

    // ── Export / Import JSON ──────────────────────────────────────────────

    describe("exportJSON / importJSON", () => {
        it("exports valid JSON with all fields", () => {
            mgr.createPlayground("exp", "JS", "// code");
            mgr.setMetadata("exp", { title: "Export Test", description: "desc", tags: "a,b" });
            const json = mgr.exportJSON("exp");
            expect(json).toBeDefined();

            const parsed = JSON.parse(json!);
            expect(parsed.code).toBe("// code");
            expect(parsed.language).toBe("JS");
            expect(parsed.title).toBe("Export Test");
            expect(parsed.description).toBe("desc");
            expect(parsed.tags).toBe("a,b");
        });

        it("returns undefined for non-existent playground", () => {
            expect(mgr.exportJSON("nope")).toBeUndefined();
        });

        it("imports JSON into a new playground", () => {
            const json = JSON.stringify({
                code: "// imported",
                language: "TS",
                title: "Imported PG",
                description: "from JSON",
                tags: "import",
            });
            expect(mgr.importJSON("imp", json)).toBe("OK");
            const doc = mgr.getPlayground("imp")!;
            expect(doc.code).toBe("// imported");
            expect(doc.language).toBe("TS");
            expect(doc.title).toBe("Imported PG");
            expect(doc.description).toBe("from JSON");
            expect(doc.tags).toBe("import");
        });

        it("imports JSON over existing playground (replaces)", () => {
            mgr.createPlayground("over", "JS", "// old");
            const json = JSON.stringify({ code: "// new", language: "JS" });
            expect(mgr.importJSON("over", json)).toBe("OK");
            expect(mgr.getCode("over")).toBe("// new");
        });

        it("handles invalid JSON gracefully", () => {
            const result = mgr.importJSON("bad", "not json at all{{{");
            expect(result).not.toBe("OK");
            expect(result).toContain("Invalid JSON");
        });

        it("defaults missing fields on import", () => {
            const json = JSON.stringify({ code: "// minimal" });
            mgr.importJSON("min", json);
            const doc = mgr.getPlayground("min")!;
            expect(doc.language).toBe("JS");
            expect(doc.title).toBe("min");
            expect(doc.description).toBe("");
            expect(doc.tags).toBe("");
        });

        it("round-trips export → import preserving all data", () => {
            mgr.createPlayground("rt", "TS", "// round trip");
            mgr.setMetadata("rt", { title: "RT", description: "round", tags: "trip" });
            const json = mgr.exportJSON("rt")!;

            const mgr2 = new PlaygroundManager();
            expect(mgr2.importJSON("rt", json)).toBe("OK");
            const doc = mgr2.getPlayground("rt")!;
            expect(doc.code).toBe("// round trip");
            expect(doc.language).toBe("TS");
            expect(doc.title).toBe("RT");
            expect(doc.description).toBe("round");
            expect(doc.tags).toBe("trip");
        });
    });
});
