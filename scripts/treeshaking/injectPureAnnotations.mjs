#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Post-compilation step: inject /*#__PURE__*‍/ annotations into .pure.js files.
 *
 * TypeScript preserves /*#__PURE__*‍/ for top-level const/let assignments, but
 * STRIPS them from static class field initializers (because tsc hoists the
 * assignment out of the class body and drops the comment).
 *
 * This script scans every .pure.js file in the compiled output and adds
 * /*#__PURE__*‍/ before call-expressions in top-level statements that don't
 * already have the annotation.
 *
 * Patterns matched (at column 0, i.e. hoisted static field assignments):
 *   ClassName.field = new Ctor(...)
 *   ClassName.field = Ctor.Method(...)
 *   ClassName.field = FunctionName(...)
 *
 * Usage:
 *   node scripts/treeshaking/injectPureAnnotations.mjs [--dry-run] [--verbose]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { globSync } from "glob";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verbose = args.includes("--verbose");

const distDir = resolve("packages/dev/core/dist");

// Find all .pure.js files in dist/
const pureFiles = globSync("**/*.pure.js", { cwd: distDir, absolute: true });

if (pureFiles.length === 0) {
    console.error("No .pure.js files found in", distDir);
    console.error("Did you forget to run tsc first?");
    process.exit(1);
}

/**
 * Matches a top-level assignment whose RHS is a call expression that
 * doesn't already have a PURE annotation:
 *
 *   SomeClass.field = new Ctor(...)
 *   SomeClass.field = Ctor.Method(...)
 *   SomeClass.field = FunctionName(...)
 *
 * Capture groups:
 *   $1 = "SomeClass.field = "
 *   $2 = the call expression start ("new Ctor(" or "Ctor.Method(" etc.)
 *
 * Only matches lines that start at column 0 (^) to avoid touching code
 * inside function bodies.
 */
const STATIC_FIELD_RHS = /^(\w+\.\w+\s*=\s*)(?!\/\*#__PURE__\*\/\s*)(new\s+\w+|[A-Z]\w*\.\w+\(|[A-Z]\w*\()/gm;

let totalAnnotations = 0;
let totalFiles = 0;

for (const filePath of pureFiles) {
    const original = readFileSync(filePath, "utf-8");
    let patched = original;
    let fileAnnotations = 0;

    patched = patched.replace(STATIC_FIELD_RHS, (match, lhs, rhs) => {
        fileAnnotations++;
        return `${lhs}/*#__PURE__*/ ${rhs}`;
    });

    if (fileAnnotations > 0) {
        totalAnnotations += fileAnnotations;
        totalFiles++;
        const rel = relative(process.cwd(), filePath);

        if (verbose || dryRun) {
            console.log(`  ${dryRun ? "[dry-run] " : ""}${rel}: +${fileAnnotations} annotation(s)`);
        }

        if (!dryRun) {
            writeFileSync(filePath, patched, "utf-8");
        }
    }
}

console.log(`\n${dryRun ? "[dry-run] " : ""}Injected ${totalAnnotations} /*#__PURE__*/ annotation(s) across ${totalFiles} file(s) (${pureFiles.length} .pure.js scanned).`);
