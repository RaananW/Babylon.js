#!/usr/bin/env node
/* eslint-disable no-console */
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "../..");
const SRC = join(REPO, "packages/dev/core/src");
const manifest = JSON.parse(readFileSync(join(REPO, "scripts/treeshaking/side-effects-manifest.json"), "utf-8")).manifest;

// Files with side effects that do NOT have .pure.ts
const missing = manifest.filter((e) => {
    const purePath = join(SRC, e.file.replace(/\.ts$/, ".pure.ts"));
    return !existsSync(purePath);
});

// Categorize
const byTypes = {};
for (const e of missing) {
    const types = new Set(e.sideEffects.map((s) => s.type));
    const key = [...types].sort().join("+");
    if (!byTypes[key]) {
        byTypes[key] = [];
    }
    byTypes[key].push(e.file);
}

console.log("Files with side effects but NO .pure.ts:", missing.length);
console.log("\nBy side-effect combination:");
for (const [k, v] of Object.entries(byTypes).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k}: ${v.length}`);
    if (v.length <= 8) {
        v.forEach((f) => console.log("    " + f));
    }
}

// Now split into "splittable" vs "unsplittable"
// Unsplittable: files that are ONLY shader content (shader-store-write only)
// or files that are ONLY prototype assignments (no class/interface/type exports)
const SHADER_ONLY_RE = /^(Shaders|ShadersWGSL)\//;
const splittable = [];
const unsplittable = [];

for (const e of missing) {
    const types = new Set(e.sideEffects.map((s) => s.type));
    // Shader-only files
    if (types.size === 1 && types.has("shader-store-write")) {
        unsplittable.push({ file: e.file, reason: "shader-only" });
        continue;
    }
    // Check if the file path is in Shaders/ or ShadersWGSL/
    if (SHADER_ONLY_RE.test(e.file)) {
        unsplittable.push({ file: e.file, reason: "shader-dir" });
        continue;
    }
    // Prototype-only files: check if they have any exports
    if (types.size === 1 && types.has("prototype-assignment")) {
        const content = readFileSync(join(SRC, e.file), "utf-8");
        const hasExportedDecl = /^export\s+(class|interface|type|enum|function|const|let|var|abstract)\s/m.test(content);
        if (!hasExportedDecl) {
            unsplittable.push({ file: e.file, reason: "prototype-only (no exports)" });
            continue;
        }
    }
    // declareModule only - these are just TypeScript type augmentations
    if (types.size === 1 && types.has("declare-module")) {
        // These are wrappers that already import from .pure and add declare module
        // They themselves don't need splitting
        unsplittable.push({ file: e.file, reason: "declare-module-only (TS type augmentation)" });
        continue;
    }
    splittable.push(e);
}

console.log(`\n\n=== SPLITTABLE: ${splittable.length} files ===`);
const splittableByTypes = {};
for (const e of splittable) {
    const types = new Set(e.sideEffects.map((s) => s.type));
    const key = [...types].sort().join("+");
    if (!splittableByTypes[key]) {
        splittableByTypes[key] = [];
    }
    splittableByTypes[key].push(e.file);
}
for (const [k, v] of Object.entries(splittableByTypes).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k}: ${v.length}`);
    v.forEach((f) => console.log("    " + f));
}

console.log(`\n=== UNSPLITTABLE: ${unsplittable.length} files ===`);
const unsplitByReason = {};
for (const e of unsplittable) {
    if (!unsplitByReason[e.reason]) {
        unsplitByReason[e.reason] = 0;
    }
    unsplitByReason[e.reason]++;
}
for (const [r, c] of Object.entries(unsplitByReason)) {
    console.log(`  ${r}: ${c}`);
}
