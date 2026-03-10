#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Split 4 remaining bare-import files that are imported by .pure.ts files.
 * Same pattern as splitBareImports.mjs but for files not in pure barrels.
 *
 * After splitting, updates the importing .pure.ts files to use .pure specifier.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve, dirname, basename, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");

const DRY_RUN = process.argv.includes("--dry-run");

const BARE_IMPORT_RE = /^import\s+["']([^"']+)["']\s*;?\s*$/;

// Files to split and who imports them
const TARGETS = [
    {
        file: "Engines/thinNativeEngine.ts",
        importers: ["Engines/nativeEngine.pure.ts"],
    },
    {
        file: "Engines/WebGPU/webgpuShaderProcessorsWGSL.ts",
        importers: ["Engines/webgpuEngine.pure.ts"],
    },
    {
        file: "Engines/WebGPU/webgpuClearQuad.ts",
        importers: ["Engines/webgpuEngine.pure.ts"],
    },
    {
        file: "Particles/thinParticleSystem.ts",
        importers: ["Particles/particleSystem.pure.ts"],
    },
];

for (const { file, importers } of TARGETS) {
    const absPath = join(CORE_SRC, file);
    const content = readFileSync(absPath, "utf-8");
    const lines = content.split("\n");

    // Find bare import lines
    const bareLines = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().match(BARE_IMPORT_RE)) {
            bareLines.push(i);
        }
    }

    if (bareLines.length === 0) {
        console.log(`SKIP ${file} — no bare imports`);
        continue;
    }

    // Build .pure.ts content (everything minus bare imports)
    const pureLines = lines.filter((_, i) => !bareLines.includes(i));
    const pureContent = pureLines.join("\n");

    // Build wrapper content
    const stem = basename(file, ".ts");
    const bareImportsText = bareLines.map((i) => lines[i]).join("\n");
    const wrapperContent = `export * from "./${stem}.pure";\n\n${bareImportsText}\n`;

    const purePath = absPath.replace(/\.ts$/, ".pure.ts");
    const relPure = relative(CORE_SRC, purePath);

    console.log(`\n--- ${file} ---`);
    console.log(`  Bare imports: ${bareLines.length}`);
    for (const i of bareLines) console.log(`    ${lines[i].trim()}`);
    console.log(`  -> ${relPure} (${pureLines.length} lines)`);
    console.log(`  -> ${file} (wrapper)`);

    if (!DRY_RUN) {
        writeFileSync(purePath, pureContent, "utf-8");
        writeFileSync(absPath, wrapperContent, "utf-8");
    }

    // Update importers to use .pure specifier
    for (const imp of importers) {
        const impPath = join(CORE_SRC, imp);
        if (!existsSync(impPath)) {
            console.log(`  WARNING: importer not found: ${imp}`);
            continue;
        }
        let impContent = readFileSync(impPath, "utf-8");
        // The import specifier is relative — we need to find the right pattern
        const impDir = dirname(impPath);
        const targetNoExt = absPath.replace(/\.ts$/, "");
        const relSpec = relative(impDir, targetNoExt);
        const relSpecNorm = relSpec.startsWith(".") ? relSpec : "./" + relSpec;

        // Replace the specifier with .pure
        const fromPattern = `from "${relSpecNorm}"`;
        const toPattern = `from "${relSpecNorm}.pure"`;
        if (impContent.includes(fromPattern)) {
            impContent = impContent.replace(fromPattern, toPattern);
            console.log(`  Updated ${imp}: ${relSpecNorm} -> ${relSpecNorm}.pure`);
            if (!DRY_RUN) {
                writeFileSync(impPath, impContent, "utf-8");
            }
        } else {
            // Try with single quotes
            const fromPatternSQ = `from '${relSpecNorm}'`;
            const toPatternSQ = `from '${relSpecNorm}.pure'`;
            if (impContent.includes(fromPatternSQ)) {
                impContent = impContent.replace(fromPatternSQ, toPatternSQ);
                console.log(`  Updated ${imp}: ${relSpecNorm} -> ${relSpecNorm}.pure`);
                if (!DRY_RUN) {
                    writeFileSync(impPath, impContent, "utf-8");
                }
            } else {
                console.log(`  WARNING: could not find import specifier "${relSpecNorm}" in ${imp}`);
                // Show what specifiers exist
                const importLines = impContent
                    .split("\n")
                    .filter((l) => l.includes("thinNativeEngine") || l.includes("webgpuShaderProcessors") || l.includes("webgpuClearQuad") || l.includes("thinParticleSystem"));
                for (const l of importLines) console.log(`    Found: ${l.trim()}`);
            }
        }
    }
}

console.log(`\n${DRY_RUN ? "(Dry run — no files modified)" : "Done!"}`);
