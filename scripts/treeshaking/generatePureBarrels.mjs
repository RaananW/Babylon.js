#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * generatePureBarrels.mjs
 *
 * Generates `pure.ts` barrel files alongside every `index.ts` in
 * `packages/dev/core/src/`.  Each `pure.ts` re-exports only from
 * side-effect-free modules:
 *
 *   - `*.pure.ts` files (split from RegisterClass wrappers in Phase 2)
 *   - Files with no module-level side effects (per audit manifest)
 *   - Subdirectory `pure.ts` barrels (recursively generated)
 *
 * Usage:
 *   node scripts/treeshaking/generatePureBarrels.mjs [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   Print what would be written without touching disk
 *   --verbose   Print detailed per-file decisions
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, dirname, relative, join, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const SRC_ROOT = resolve(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = resolve(__dirname, "side-effects-manifest.json");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

const HEADER = `/** Pure barrel — re-exports only side-effect-free modules */\n`;

// ── Load side-effects manifest ──────────────────────────────────────────────
const manifestData = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
// manifest is an array of { file, sideEffects }
// file paths are relative to SRC_ROOT (e.g. "Actions/action.ts")
const sideEffectFiles = new Set(manifestData.manifest.map((e) => e.file));

// ── Scan for existing .pure.ts files ────────────────────────────────────────
const pureFileSet = new Set();
function scanForPureFiles(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            scanForPureFiles(join(dir, entry.name));
        } else if (entry.name.endsWith(".pure.ts") && entry.name !== "pure.ts") {
            // e.g. "math.color.pure.ts" — store relative to SRC_ROOT without extension
            const rel = relative(SRC_ROOT, join(dir, entry.name));
            // Store without ".ts" extension so we can match against specifiers
            pureFileSet.add(rel.replace(/\.ts$/, ""));
        }
    }
}
scanForPureFiles(SRC_ROOT);

if (VERBOSE) {
    console.log(`Found ${pureFileSet.size} .pure.ts files`);
    console.log(`Manifest has ${sideEffectFiles.size} files with side effects`);
}

// ── Stats ───────────────────────────────────────────────────────────────────
let barrelCount = 0;
let skippedExports = 0;
let rewrittenToPure = 0;
let keptAsIs = 0;
let skippedBareImports = 0;
let emptyBarrels = 0;
let subdirRewrites = 0;

// ── Recursive barrel processor ──────────────────────────────────────────────
const processedDirs = new Map(); // dir → boolean (hasPure)

/**
 * Process a directory: generates pure.ts alongside index.ts.
 * Returns true if a non-empty pure.ts was written/would-be-written.
 * @param {string} dir Absolute path to directory to process
 * @returns {boolean} Whether pure.ts was generated with exports
 */
function processDirectory(dir) {
    if (processedDirs.has(dir)) {
        return processedDirs.get(dir);
    }
    const indexPath = join(dir, "index.ts");
    if (!existsSync(indexPath)) {
        processedDirs.set(dir, false);
        return false;
    }

    const content = readFileSync(indexPath, "utf-8");
    const lines = content.split("\n");
    const outputLines = [];
    let hasExports = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty / whitespace-only lines
        if (!trimmed) {
            continue;
        }

        // Keep eslint-disable comments
        if (trimmed.startsWith("/* eslint-disable") || trimmed.startsWith("// eslint-disable")) {
            outputLines.push(trimmed);
            continue;
        }

        // Skip bare side-effect imports: import "./file"
        if (/^import\s+["']/.test(trimmed)) {
            skippedBareImports++;
            if (VERBOSE) {
                const relDir = relative(SRC_ROOT, dir);
                console.log(`  SKIP bare import in ${relDir}/index.ts: ${trimmed}`);
            }
            continue;
        }

        // Handle: export * from "./path"
        const starExport = trimmed.match(/^export\s+\*\s+from\s+["'](.+?)["']\s*;?\s*$/);
        if (starExport) {
            const result = resolveExport(dir, starExport[1], line);
            if (result) {
                outputLines.push(result);
                hasExports = true;
            }
            continue;
        }

        // Handle: export { Foo, Bar } from "./path"
        const namedExport = trimmed.match(/^export\s+\{([^}]+)\}\s+from\s+["'](.+?)["']\s*;?\s*$/);
        if (namedExport) {
            const result = resolveNamedExport(dir, namedExport[2], namedExport[1], line);
            if (result) {
                outputLines.push(result);
                hasExports = true;
            }
            continue;
        }

        // Generic comments — keep
        if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
            outputLines.push(trimmed);
            continue;
        }

        // Anything else we don't understand — warn and skip
        if (VERBOSE) {
            console.log(`  SKIP unknown line in ${relative(SRC_ROOT, dir)}/index.ts: ${trimmed}`);
        }
    }

    if (!hasExports) {
        emptyBarrels++;
        if (VERBOSE) {
            console.log(`  EMPTY barrel: ${relative(SRC_ROOT, dir)}/pure.ts — no pure exports`);
        }
        processedDirs.set(dir, false);
        return false;
    }

    // Build the file
    const purePath = join(dir, "pure.ts");
    const eslintLine = outputLines.find((l) => l.includes("eslint-disable"));
    const exportLines = outputLines.filter((l) => !l.includes("eslint-disable") && !l.startsWith("//") && !l.startsWith("/*"));
    const commentLines = outputLines.filter((l) => l.startsWith("//") || (l.startsWith("/*") && !l.includes("eslint-disable")));

    let fileContent = HEADER;
    if (eslintLine) {
        fileContent += eslintLine + "\n";
    }
    for (const exp of exportLines) {
        fileContent += exp + "\n";
    }

    const relPure = relative(SRC_ROOT, purePath);
    if (DRY_RUN) {
        console.log(`\n[DRY-RUN] Would write ${relPure}:`);
        console.log(fileContent);
    } else {
        writeFileSync(purePath, fileContent, "utf-8");
        if (VERBOSE) {
            console.log(`  WROTE ${relPure} (${exportLines.length} exports)`);
        }
    }
    barrelCount++;
    processedDirs.set(dir, true);
    return true;
}

/**
 * Resolve an `export * from "./specifier"` line.
 * Returns the rewritten line for pure.ts, or null to skip.
 * @param {string} dir Absolute path of the directory containing the export line
 * @param {string} specifier The module specifier string (e.g. "./math.color")
 * @param {string} originalLine The original export line (for logging/keeping as-is)
 * @returns {string|null} The resolved export line for pure.ts, or null to skip
 */
function resolveExport(dir, specifier, originalLine) {
    // Case 1: Subdirectory barrel reference (ends with /index)
    if (specifier.endsWith("/index")) {
        const subDir = resolve(dir, specifier.replace(/\/index$/, ""));
        // Recursively generate pure.ts for subdirectory
        const hasPure = processDirectory(subDir);
        if (hasPure) {
            subdirRewrites++;
            return `export * from "${specifier.replace(/\/index$/, "/pure")}";`;
        }
        // Subdirectory has no pure exports — skip
        skippedExports++;
        if (VERBOSE) {
            console.log(`  SKIP subdir (no pure exports): ${specifier}`);
        }
        return null;
    }

    // Case 2: File reference — check for .pure.ts or pure file
    const resolvedFile = resolve(dir, specifier + ".ts");
    const relPath = relative(SRC_ROOT, resolve(dir, specifier));
    const pureSpecifier = specifier + ".pure";
    const pureRelPath = relPath + ".pure"; // e.g. "Maths/math.color.pure"

    // If the .ts file actually exists as a file, handle as file reference
    if (existsSync(resolvedFile) && statSync(resolvedFile).isFile()) {
        if (pureFileSet.has(pureRelPath)) {
            rewrittenToPure++;
            return `export * from "${pureSpecifier}";`;
        }
        const filePath = relPath + ".ts";
        if (!sideEffectFiles.has(filePath)) {
            keptAsIs++;
            return originalLine.trim();
        }
        skippedExports++;
        if (VERBOSE) {
            console.log(`  SKIP (side effects, no .pure): ${filePath}`);
        }
        return null;
    }

    // Case 3: Could be a directory without explicit /index
    const possibleDir = resolve(dir, specifier);
    if (existsSync(possibleDir) && statSync(possibleDir).isDirectory()) {
        const subIndexPath = join(possibleDir, "index.ts");
        if (existsSync(subIndexPath)) {
            const hasPure = processDirectory(possibleDir);
            if (hasPure) {
                subdirRewrites++;
                return `export * from "${specifier}/pure";`;
            }
            skippedExports++;
            return null;
        }
    }

    // Case 4: File reference (no .ts file found) — check manifest
    if (pureFileSet.has(pureRelPath)) {
        rewrittenToPure++;
        return `export * from "${pureSpecifier}";`;
    }

    const filePath = relPath + ".ts";
    if (!sideEffectFiles.has(filePath)) {
        keptAsIs++;
        return originalLine.trim();
    }

    // Case 5: File has side effects and no .pure.ts — skip
    skippedExports++;
    if (VERBOSE) {
        console.log(`  SKIP (side effects, no .pure): ${filePath}`);
    }
    return null;
}

/**
 * Resolve an `export { ... } from "./specifier"` line.
 * Same logic as resolveExport but preserves the named exports.
 * @param {string} dir Absolute path of the directory containing the export line
 * @param {string} specifier The module specifier string (e.g. "./math.color")
 * @param {string} names The named exports inside the braces (e.g. "Foo, Bar")
 * @param {string} originalLine The original export line (for logging/keeping as-is)
 * @returns {string|null} The resolved export line for pure.ts, or null to skip
 */
function resolveNamedExport(dir, specifier, names, originalLine) {
    const relPath = relative(SRC_ROOT, resolve(dir, specifier));
    const pureSpecifier = specifier + ".pure";
    const pureRelPath = relPath + ".pure";

    if (pureFileSet.has(pureRelPath)) {
        rewrittenToPure++;
        return `export {${names}} from "${pureSpecifier}";`;
    }

    const filePath = relPath + ".ts";
    if (!sideEffectFiles.has(filePath)) {
        keptAsIs++;
        return originalLine.trim();
    }

    skippedExports++;
    if (VERBOSE) {
        console.log(`  SKIP named export (side effects, no .pure): ${filePath}`);
    }
    return null;
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log("Generating pure.ts barrel files…\n");

// Process from root — recursion handles subdirectories
processDirectory(SRC_ROOT);

// Also scan for any index.ts not reachable from root
function findUnprocessed(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            const subDir = join(dir, entry.name);
            const indexPath = join(subDir, "index.ts");
            if (existsSync(indexPath) && !processedDirs.has(subDir)) {
                if (VERBOSE) {
                    console.log(`  Processing unreachable: ${relative(SRC_ROOT, subDir)}`);
                }
                processDirectory(subDir);
            }
            findUnprocessed(subDir);
        }
    }
}
findUnprocessed(SRC_ROOT);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log("\n═══ Summary ═══");
console.log(`  Barrel files generated:      ${barrelCount}`);
console.log(`  Exports rewritten to .pure:  ${rewrittenToPure}`);
console.log(`  Exports kept as-is (pure):   ${keptAsIs}`);
console.log(`  Subdir rewrites to /pure:    ${subdirRewrites}`);
console.log(`  Bare imports skipped:        ${skippedBareImports}`);
console.log(`  Exports skipped (impure):    ${skippedExports}`);
console.log(`  Empty barrels (not written): ${emptyBarrels}`);
