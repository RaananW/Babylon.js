#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Audit: check whether .pure.ts files import from side-effectful files.
 */
import { readFileSync, readdirSync } from "fs";
import { join, resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const CORE = join(REPO_ROOT, "packages/dev/core/src");

function walk(dir) {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else if (e.name.endsWith(".pure.ts") && e.name !== "pure.ts") out.push(p);
    }
    return out;
}

// Load manifest
const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "scripts/treeshaking/side-effects-manifest.json"), "utf-8"));
const seFiles = new Set(manifest.manifest.map((r) => r.file));

// Build a map of sideEffect types per file
const seTypes = new Map();
for (const r of manifest.manifest) {
    seTypes.set(
        r.file,
        r.sideEffects.map((s) => s.type)
    );
}

// Files whose ONLY side effects are declare-module (runtime-pure)
const declareModuleOnly = new Set(manifest.manifest.filter((r) => r.sideEffects.every((s) => s.type === "declare-module")).map((r) => r.file));

// Files with real runtime side effects (anything beyond declare-module)
const runtimeSEFiles = new Set(manifest.manifest.filter((r) => r.sideEffects.some((s) => s.type !== "declare-module")).map((r) => r.file));

const IMPORT_RE = /^import\s+(?!type\s)(?:\{[^}]*\}|[^{}"'\n]+(?:,\s*\{[^}]*\})?|\*\s+as\s+\w+)\s+from\s+["']([^"']+)["']/;
const BARE_RE = /^import\s+["']([^"']+)["']\s*;?\s*$/;

let totalRelative = 0;
let fromSideEffectful = 0;
let fromDeclareModuleOnly = 0;
let fromRuntimeSE = 0;
let bareImports = 0;
const details = [];

for (const f of walk(CORE)) {
    const dir = dirname(f);
    for (const rawLine of readFileSync(f, "utf-8").split("\n")) {
        const line = rawLine.trim();

        // Check for bare imports (should not exist in .pure.ts at all)
        const bareM = line.match(BARE_RE);
        if (bareM) {
            bareImports++;
            details.push({
                from: relative(CORE, f),
                imports: bareM[1],
                resolved: "BARE",
                types: ["bare-import"],
            });
            continue;
        }

        const m = line.match(IMPORT_RE);
        if (!m) continue;
        const spec = m[1];
        if (!spec.startsWith(".")) continue;
        totalRelative++;

        const abs = resolve(dir, spec);
        let rel = relative(CORE, abs);
        if (!rel.endsWith(".ts")) rel += ".ts";

        if (seFiles.has(rel)) {
            fromSideEffectful++;
            const isDeclOnly = declareModuleOnly.has(rel);
            if (isDeclOnly) fromDeclareModuleOnly++;
            else fromRuntimeSE++;
            details.push({
                from: relative(CORE, f),
                imports: spec,
                resolved: rel,
                types: seTypes.get(rel) || [],
                declareModuleOnly: isDeclOnly,
            });
        }
    }
}

console.log("=== Pure-file import audit ===\n");
console.log(`Total .pure.ts files scanned: ${walk(CORE).length}`);
console.log(`Total relative value imports: ${totalRelative}`);
console.log(`Bare side-effect imports found: ${bareImports}`);
console.log(`Value imports pointing to side-effectful files: ${fromSideEffectful}`);
console.log(`  - declare-module only (runtime-pure, harmless): ${fromDeclareModuleOnly}`);
console.log(`  - real runtime side effects: ${fromRuntimeSE}`);
console.log();

if (details.length > 0) {
    // Separate runtime-SE from declare-module-only
    const runtimeDetails = details.filter((d) => !d.declareModuleOnly);
    const declDetails = details.filter((d) => d.declareModuleOnly);

    // Group runtime-SE by target
    if (runtimeDetails.length > 0) {
        const byTarget = {};
        for (const d of runtimeDetails) {
            const key = d.resolved;
            if (!byTarget[key]) byTarget[key] = { importers: [], types: d.types };
            byTarget[key].importers.push(d.from);
        }
        const sorted = Object.entries(byTarget).sort((a, b) => b[1].importers.length - a[1].importers.length);

        console.log(`\n--- RUNTIME SIDE-EFFECTFUL targets (${sorted.length} unique) ---`);
        console.log("These are actual problems that affect bundle size:\n");
        for (const [target, info] of sorted) {
            const typeStr = [...new Set(info.types)].join(", ");
            console.log(`  ${target}  (${info.importers.length} importers)  [${typeStr}]`);
            for (const imp of info.importers) {
                console.log(`    <- ${imp}`);
            }
        }
    }

    // Summarize declare-module-only
    if (declDetails.length > 0) {
        const byTarget = {};
        for (const d of declDetails) {
            const key = d.resolved;
            if (!byTarget[key]) byTarget[key] = { importers: [] };
            byTarget[key].importers.push(d.from);
        }
        const sorted = Object.entries(byTarget).sort((a, b) => b[1].importers.length - a[1].importers.length);
        console.log(`\n--- DECLARE-MODULE ONLY targets (${sorted.length} unique, ${declDetails.length} imports) ---`);
        console.log("These are runtime-pure (declare module erased by TypeScript):\n");
        for (const [target, info] of sorted.slice(0, 10)) {
            console.log(`  ${target}  (${info.importers.length} importers)`);
        }
        if (sorted.length > 10) console.log(`  ... and ${sorted.length - 10} more`);
    }

    // Categorize by side-effect type
    const typeCounts = {};
    for (const d of details) {
        for (const t of d.types) {
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
    }
    console.log("\nAll imports by side-effect type of target:");
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count}`);
    }
} else {
    console.log("All .pure.ts files import only from pure (side-effect-free) files!");
}
