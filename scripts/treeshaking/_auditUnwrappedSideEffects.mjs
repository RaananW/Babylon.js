#!/usr/bin/env node
/**
 * Audit: find thin .ts wrappers that still have unwrapped side effects
 * (code in the .ts file that is NOT inside a register function).
 */
import { readFileSync, readdirSync } from "fs";
import { join, relative, basename } from "path";

const SRC = "packages/dev/core/src";

function walk(dir, results = []) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
            if (["test", "Shaders", "ShadersWGSL"].includes(e.name)) continue;
            walk(p, results);
        } else if (
            e.name.endsWith(".ts") &&
            !e.name.endsWith(".pure.ts") &&
            !e.name.endsWith(".types.ts") &&
            !e.name.endsWith(".d.ts") &&
            e.name !== "index.ts" &&
            e.name !== "pure.ts"
        ) {
            results.push(p);
        }
    }
    return results;
}

const files = walk(SRC);
const unwrapped = [];

for (const f of files) {
    const content = readFileSync(f, "utf-8");
    // Only look at files that already have a .pure re-export (they are thin wrappers)
    if (!content.includes(".pure")) continue;
    if (!/export \* from.*\.pure/.test(content)) continue;

    const lines = content.split("\n");
    const sideEffectLines = lines.filter((l) => {
        const t = l.trim();
        if (!t) return false;
        if (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("*/")) return false;
        if (t.startsWith("export *")) return false;
        if (t.startsWith("import type")) return false;
        // import { registerXxx } from "./foo.pure"
        if (/^import\s*\{.*\}\s*from\s*["'].*\.pure["']/.test(t)) return false;
        // registerXxx();
        if (/^register\w+\(\);?\s*$/.test(t)) return false;
        return true;
    });

    if (sideEffectLines.length > 0) {
        unwrapped.push({
            file: relative(SRC, f),
            lines: sideEffectLines.length,
            sample: sideEffectLines.slice(0, 5).map((s) => s.trim()),
        });
    }
}

unwrapped.sort((a, b) => b.lines - a.lines);
console.log(`Found ${unwrapped.length} thin wrappers with unwrapped side effects:\n`);

// Categorize
const categories = { AddParser: [], RegisterClass: [], staticAssignment: [], AddNodeConstructor: [], topLevelCall: [], other: [] };

for (const u of unwrapped) {
    const allSample = u.sample.join(" ");
    if (allSample.includes("AddParser")) categories.AddParser.push(u);
    else if (allSample.includes("RegisterClass")) categories.RegisterClass.push(u);
    else if (allSample.includes("AddNodeConstructor")) categories.AddNodeConstructor.push(u);
    else if (/\.\w+\s*=/.test(allSample)) categories.staticAssignment.push(u);
    else categories.other.push(u);
}

for (const [cat, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    console.log(`\n=== ${cat} (${items.length} files) ===`);
    for (const u of items) {
        console.log(`  ${u.file} (${u.lines} lines)`);
        for (const s of u.sample) console.log(`    ${s}`);
    }
}

console.log(`\nTotal: ${unwrapped.length} files with unwrapped side effects`);
