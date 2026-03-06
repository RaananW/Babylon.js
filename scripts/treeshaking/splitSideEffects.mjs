#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Generalized Side-Effect Splitter for @babylonjs/core
 *
 * Splits ANY file with runtime side effects into:
 *   - FILE.pure.ts  — all pure code (no runtime side effects)
 *   - FILE.ts       — wrapper: re-exports pure + runs side effects
 *
 * Side-effect types handled:
 *   - RegisterClass(...)
 *   - Node.AddNodeConstructor(...)
 *   - ClassName.prototype.method = ... (prototype assignments)
 *   - ClassName.staticProp = ... (static property assignments)
 *   - Top-level function calls (e.g. InitSideEffects())
 *   - WebXRFeaturesManager.AddWebXRFeature(...)
 *   - ShaderStore writes (not typically split — shader-only files are skipped)
 *
 * NOT considered side effects (kept in .pure.ts):
 *   - declare module blocks (compile-time only, zero runtime cost)
 *   - import/export statements
 *   - class/interface/type/enum/function/const declarations
 *
 * Usage:
 *   node scripts/treeshaking/splitSideEffects.mjs [--dry-run] [--file <rel-path>] [--verbose] [--resplit]
 *
 * Flags:
 *   --dry-run   Show what would be done without writing files
 *   --file <p>  Only process a single file (relative path from core/src)
 *   --verbose   Show detailed output for each file
 *   --resplit   Re-process files that already have .pure.ts (regenerate both)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve, dirname, basename, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = join(REPO_ROOT, "scripts/treeshaking/side-effects-manifest.json");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const RESPLIT = args.includes("--resplit");
const fileIdx = args.indexOf("--file");
const SINGLE_FILE = fileIdx !== -1 ? args[fileIdx + 1] : null;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PURE_HEADER = "/** This file must only contain pure code and pure imports */\n\n";

// Files that should never be split (defines RegisterClass itself, etc.)
const SKIP_FILES = new Set(["Misc/typeStore.ts"]);

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

function collectTsFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectTsFiles(fullPath));
        } else if (
            entry.isFile() &&
            entry.name.endsWith(".ts") &&
            !entry.name.endsWith(".d.ts") &&
            !entry.name.endsWith(".test.ts") &&
            !entry.name.endsWith(".spec.ts") &&
            !entry.name.endsWith(".pure.ts")
        ) {
            results.push(fullPath);
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
// Import parser
// ---------------------------------------------------------------------------

/**
 * Parse all import statements from source lines.
 * Handles single-line and multi-line imports.
 * Returns array of:
 *   { startLine, endLine, text, names: [{name, alias}], modulePath, isType, isDefault, isNamespace, isSideEffectOnly }
 */
function parseImports(lines) {
    const imports = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip non-import lines
        if (!trimmed.startsWith("import ")) {
            i++;
            continue;
        }

        // Collect the full import statement (may span multiple lines)
        let fullText = line;
        let endLine = i;

        // Check if the import is complete (has the closing semicolon or quote)
        while (!fullText.includes(" from ") || !fullText.trim().endsWith(";")) {
            // Also check for side-effect imports: import "module";
            if (/^import\s+["']/.test(fullText.trim()) && fullText.trim().endsWith(";")) break;
            endLine++;
            if (endLine >= lines.length) break;
            fullText += "\n" + lines[endLine];
        }

        // Parse the import
        const importInfo = parseImportStatement(fullText, i, endLine);
        if (importInfo) {
            imports.push(importInfo);
        }

        i = endLine + 1;
    }

    return imports;
}

function parseImportStatement(text, startLine, endLine) {
    const singleLine = text.replace(/\n/g, " ").trim();

    // Side-effect import: import "module";
    const sideEffectMatch = singleLine.match(/^import\s+["']([^"']+)["']\s*;?$/);
    if (sideEffectMatch) {
        return {
            startLine,
            endLine,
            text,
            names: [],
            modulePath: sideEffectMatch[1],
            isType: false,
            isDefault: false,
            isNamespace: false,
            isSideEffectOnly: true,
        };
    }

    // Type import: import type { ... } from "...";
    const isType = /^import\s+type\s/.test(singleLine);

    // Named imports: import { A, B as C } from "...";
    const namedMatch = singleLine.match(/^import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']\s*;?$/);
    if (namedMatch) {
        const names = namedMatch[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => {
                const parts = s.split(/\s+as\s+/);
                return { name: parts[0].trim(), alias: parts.length > 1 ? parts[1].trim() : null };
            });
        return { startLine, endLine, text, names, modulePath: namedMatch[2], isType, isDefault: false, isNamespace: false, isSideEffectOnly: false };
    }

    // Default import: import Foo from "...";
    const defaultMatch = singleLine.match(/^import\s+(?:type\s+)?([A-Za-z_$]\w*)\s+from\s+["']([^"']+)["']\s*;?$/);
    if (defaultMatch) {
        return {
            startLine,
            endLine,
            text,
            names: [{ name: "default", alias: defaultMatch[1] }],
            modulePath: defaultMatch[2],
            isType,
            isDefault: true,
            isNamespace: false,
            isSideEffectOnly: false,
        };
    }

    // Namespace import: import * as Foo from "...";
    const nsMatch = singleLine.match(/^import\s+(?:type\s+)?\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["']\s*;?$/);
    if (nsMatch) {
        return {
            startLine,
            endLine,
            text,
            names: [{ name: "*", alias: nsMatch[1] }],
            modulePath: nsMatch[2],
            isType,
            isDefault: false,
            isNamespace: true,
            isSideEffectOnly: false,
        };
    }

    return null;
}

// ---------------------------------------------------------------------------
// Side-effect detection & block extent finding
// ---------------------------------------------------------------------------

/**
 * Character-level scanner that tracks:
 *   - brace depth { }
 *   - paren depth ( )
 *   - bracket depth [ ]
 *   - string/template literal state
 *   - block comment state
 */
class BracketTracker {
    constructor() {
        this.braceDepth = 0;
        this.parenDepth = 0;
        this.bracketDepth = 0;
        this.inSingle = false;
        this.inDouble = false;
        this.inTemplate = false;
        this.inBlockComment = false;
    }

    get isBalanced() {
        return this.braceDepth <= 0 && this.parenDepth <= 0 && this.bracketDepth <= 0;
    }

    processLine(line) {
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            const prev = c > 0 ? line[c - 1] : "";

            // Block comment
            if (this.inBlockComment) {
                if (ch === "/" && prev === "*") {
                    this.inBlockComment = false;
                }
                continue;
            }

            if (ch === "/" && c + 1 < line.length && line[c + 1] === "*" && !this.inSingle && !this.inDouble && !this.inTemplate) {
                this.inBlockComment = true;
                c++; // skip the *
                continue;
            }

            // Line comment
            if (ch === "/" && c + 1 < line.length && line[c + 1] === "/" && !this.inSingle && !this.inDouble && !this.inTemplate) {
                break; // rest of line is comment
            }

            // Skip escaped characters
            if (prev === "\\") continue;

            // String tracking
            if (ch === "'" && !this.inDouble && !this.inTemplate) {
                this.inSingle = !this.inSingle;
                continue;
            }
            if (ch === '"' && !this.inSingle && !this.inTemplate) {
                this.inDouble = !this.inDouble;
                continue;
            }
            if (ch === "`" && !this.inSingle && !this.inDouble) {
                this.inTemplate = !this.inTemplate;
                continue;
            }

            // Only count brackets outside strings
            if (!this.inSingle && !this.inDouble && !this.inTemplate) {
                if (ch === "{") this.braceDepth++;
                if (ch === "}") this.braceDepth--;
                if (ch === "(") this.parenDepth++;
                if (ch === ")") this.parenDepth--;
                if (ch === "[") this.bracketDepth++;
                if (ch === "]") this.bracketDepth--;
            }
        }
    }
}

/**
 * Find the end line of a multi-line block starting at `startIdx`.
 * Tracks braces, parens, and brackets.
 * Returns the line index where the block ends (inclusive).
 */
function findBlockEnd(lines, startIdx) {
    const tracker = new BracketTracker();

    for (let i = startIdx; i < lines.length; i++) {
        tracker.processLine(lines[i]);

        // Block ends when all brackets are balanced
        if (tracker.isBalanced) {
            const trimmed = lines[i].trim();
            // Check for statement completion
            if (trimmed.endsWith(";") || trimmed.endsWith("}") || trimmed.endsWith(",") || trimmed === "") {
                return i;
            }
            // If we opened a block (braces went up then back to 0), that's the end
            if (i > startIdx) {
                return i;
            }
        }
    }

    return startIdx;
}

/**
 * Find leading comment lines before a block (JSDoc, single-line comments, blank lines between comments).
 * Returns the first line index of the leading comment block.
 */
function findLeadingCommentStart(lines, blockStart) {
    let start = blockStart;

    for (let i = blockStart - 1; i >= 0; i--) {
        const trimmed = lines[i].trim();
        if (trimmed === "") {
            // Blank line — might be between comments, check if there's a comment above
            if (
                i > 0 &&
                (lines[i - 1].trim().startsWith("//") || lines[i - 1].trim().startsWith("*") || lines[i - 1].trim().startsWith("/*") || lines[i - 1].trim().endsWith("*/"))
            ) {
                start = i;
                continue;
            }
            // Single blank line at the very start — include it to keep formatting clean
            start = i;
            break;
        }
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.endsWith("*/")) {
            start = i;
            continue;
        }
        break;
    }

    return start;
}

/**
 * Detect all runtime side-effect blocks in the source.
 * Returns array of { startLine, endLine, type, includeComments: bool }
 * Line indices are 0-based.
 *
 * Does NOT classify `declare module` as a side effect (it's type-only).
 */
function findSideEffectBlocks(lines) {
    const blocks = [];
    let braceDepth = 0;
    let inBlockComment = false;
    let inDeclareModule = false;
    let inTemplateLiteral = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle block comments
        if (inBlockComment) {
            const endIdx = line.indexOf("*/");
            if (endIdx === -1) continue;
            line = line.substring(endIdx + 2);
            inBlockComment = false;
        }

        // Template literals
        if (inTemplateLiteral) {
            const btIdx = line.indexOf("`");
            if (btIdx === -1) continue;
            line = line.substring(btIdx + 1);
            inTemplateLiteral = false;
        }

        // Strip inline block comments
        line = line.replace(/\/\*.*?\*\//g, "");
        const blockStart = line.indexOf("/*");
        if (blockStart !== -1) {
            line = line.substring(0, blockStart);
            inBlockComment = true;
        }
        // Strip line comments
        line = line.replace(/\/\/.*$/, "");
        const trimmed = line.trim();

        // Brace-depth tracking (with string awareness)
        const prevDepth = braceDepth;
        let inSingleQuote = false;
        let inDoubleQuote = false;
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            const prev = c > 0 ? line[c - 1] : "";
            if (prev === "\\") continue;
            if (ch === "'" && !inDoubleQuote && !inTemplateLiteral) {
                inSingleQuote = !inSingleQuote;
                continue;
            }
            if (ch === '"' && !inSingleQuote && !inTemplateLiteral) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }
            if (ch === "`" && !inSingleQuote && !inDoubleQuote) {
                inTemplateLiteral = !inTemplateLiteral;
                continue;
            }
            if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
                if (ch === "{") braceDepth++;
                if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
            }
        }
        inSingleQuote = false;
        inDoubleQuote = false;

        // Track declare module blocks (NOT side effects — keep in pure)
        if (prevDepth === 0 && /^\s*declare\s+module\s+/.test(lines[i])) {
            inDeclareModule = true;
            continue;
        }
        if (inDeclareModule && braceDepth === 0) {
            inDeclareModule = false;
            continue;
        }
        if (inDeclareModule) {
            continue;
        }

        // Only detect at top-level
        if (prevDepth !== 0) continue;

        // --- Side-effect patterns ---
        let detected = null;

        // RegisterClass(...)
        if (/\bRegisterClass\s*\(/.test(trimmed)) {
            detected = "RegisterClass";
        }

        // *.prototype.* = ...
        if (!detected && /\w+\.prototype\.\w+\s*=/.test(trimmed)) {
            detected = "prototype-assignment";
        }

        // ShaderStore writes
        if (!detected && /ShaderStore\.\w*Store\w*\s*\[/.test(trimmed)) {
            detected = "shader-store-write";
        }

        // Node.AddNodeConstructor(...)
        if (!detected && (/\bNode\.AddNodeConstructor\s*\(/.test(trimmed) || /\bAddNodeConstructor\s*\(/.test(trimmed))) {
            detected = "AddNodeConstructor";
        }

        // Top-level function calls (statement-like)
        if (!detected && /^[A-Za-z_$]\w*(?:\.\w+)*\s*\(/.test(trimmed)) {
            // Exclude keywords and import/export
            const keyword = trimmed.split(/[\s(]/)[0];
            const reserved = new Set([
                "import",
                "export",
                "const",
                "let",
                "var",
                "class",
                "function",
                "type",
                "interface",
                "enum",
                "abstract",
                "declare",
                "if",
                "for",
                "while",
                "switch",
                "return",
                "throw",
                "try",
                "catch",
                "finally",
                "do",
                "new",
                "delete",
                "typeof",
                "void",
                "yield",
                "await",
            ]);
            if (!reserved.has(keyword)) {
                detected = "top-level-call";
            }
        }

        // Static property assignment: Identifier.identifier = ... (but not prototype assignments or exports)
        if (!detected && /^[A-Z]\w*\.\w+\s*=\s*/.test(trimmed) && !/\.prototype\./.test(trimmed) && !trimmed.startsWith("export ")) {
            detected = "static-property-assignment";
        }

        if (detected) {
            // Find the extent of this block
            const blockEnd = findBlockEnd(lines, i);
            // Find leading comments
            const commentStart = findLeadingCommentStart(lines, i);

            blocks.push({
                startLine: commentStart,
                endLine: blockEnd,
                codeStartLine: i, // actual code start (without comments)
                type: detected,
            });

            // Skip past this block
            // Update braceDepth to match end of block
            // Actually, we need to re-sync braceDepth since we're skipping lines
            // The simplest approach: trust that after the block, we're back at depth 0
            braceDepth = 0;
            i = blockEnd;
        }
    }

    return blocks;
}

// ---------------------------------------------------------------------------
// Identifier usage analysis
// ---------------------------------------------------------------------------

/**
 * Find all identifier-like tokens in a string of code.
 * Simple word-boundary regex. Returns a Set of identifier strings.
 */
function findIdentifiers(code) {
    const ids = new Set();
    // Remove strings, template literals, and comments to avoid false matches
    const cleaned = code
        .replace(/\/\/.*$/gm, "") // line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
        .replace(/"(?:[^"\\]|\\.)*"/g, '""') // double-quoted strings
        .replace(/'(?:[^'\\]|\\.)*'/g, "''") // single-quoted strings
        .replace(/`(?:[^`\\]|\\.)*`/g, "``"); // template literals (simplified — won't handle nested)

    for (const match of cleaned.matchAll(/\b([A-Za-z_$]\w*)\b/g)) {
        ids.add(match[1]);
    }
    return ids;
}

/**
 * Strip the contents of `declare module` blocks from code.
 * Used to avoid counting identifiers inside declare module augmentations
 * as references to module-level imports.
 */
function stripDeclareModuleBlocks(code) {
    const lines = code.split("\n");
    const result = [];
    let braceDepth = 0;
    let inDeclareModule = false;

    for (const line of lines) {
        if (!inDeclareModule && /^\s*declare\s+module\s+/.test(line)) {
            inDeclareModule = true;
        }

        if (inDeclareModule) {
            for (const ch of line) {
                if (ch === "{") braceDepth++;
                if (ch === "}") braceDepth--;
            }
            if (braceDepth <= 0) {
                inDeclareModule = false;
                braceDepth = 0;
            }
            // Skip this line (inside declare module)
            continue;
        }

        result.push(line);
    }

    return result.join("\n");
}

/**
 * Check which import names are used in a block of code.
 */
function analyzeImportUsage(imports, code) {
    const codeIds = findIdentifiers(code);
    const result = new Map(); // importIndex -> Set of used names

    for (let idx = 0; idx < imports.length; idx++) {
        const imp = imports[idx];
        if (imp.isSideEffectOnly) continue;

        const usedNames = new Set();
        for (const nameObj of imp.names) {
            const localName = nameObj.alias || nameObj.name;
            if (localName === "*") {
                // Namespace import — check if the alias is used
                if (codeIds.has(nameObj.alias)) {
                    usedNames.add(nameObj.name);
                }
            } else if (localName === "default") {
                if (codeIds.has(nameObj.alias)) {
                    usedNames.add(nameObj.name);
                }
            } else {
                if (codeIds.has(localName)) {
                    usedNames.add(nameObj.name);
                }
            }
        }

        if (usedNames.size > 0) {
            result.set(idx, usedNames);
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// Collect exported names from pure content
// ---------------------------------------------------------------------------

function findExportedNames(pureLines) {
    const names = new Set();

    // Track brace depth to skip declare module block internals
    let braceDepth = 0;
    let inDeclareModule = false;

    for (const line of pureLines) {
        const trimmed = line.trim();

        // Track declare module blocks
        if (braceDepth === 0 && /^\s*declare\s+module\s+/.test(line)) {
            inDeclareModule = true;
        }

        // Count braces (simplified — good enough for export detection)
        for (const ch of line) {
            if (ch === "{") braceDepth++;
            if (ch === "}") braceDepth--;
        }

        if (inDeclareModule) {
            if (braceDepth <= 0) {
                inDeclareModule = false;
                braceDepth = 0;
            }
            continue; // Skip exports inside declare module blocks
        }

        // Only top-level exports (braceDepth should be 0)
        if (braceDepth > 0) continue;

        // export class Foo / export abstract class Foo / export async function foo / etc.
        const match = trimmed.match(/^export\s+(?:abstract\s+|async\s+|default\s+)*(?:class|function|const|let|var|interface|type|enum)\s+([A-Za-z_$]\w*)/);
        if (match) {
            names.add(match[1]);
        }

        // export { Foo, Bar }
        const bracketMatch = trimmed.match(/^export\s+\{([^}]+)\}/);
        if (bracketMatch) {
            for (const name of bracketMatch[1].split(",")) {
                const cleaned = name
                    .trim()
                    .split(/\s+as\s+/)[0]
                    .trim();
                if (cleaned) names.add(cleaned);
            }
        }
    }

    return names;
}

// ---------------------------------------------------------------------------
// Detect local definitions only used by side-effect code
// ---------------------------------------------------------------------------

/**
 * Find non-exported, non-imported top-level variable/function definitions
 * that are ONLY referenced by side-effect code.
 * These should be moved from pure to wrapper.
 * Returns array of { startLine, endLine, name }
 */
function findSideEffectOnlyLocals(lines, importLineSet, sideEffectLineSet, pureContentLines, seContentStr) {
    const result = [];

    // Find all top-level non-exported declarations in the pure portion
    const declarations = [];
    let braceDepth = 0;
    let inDeclareModule = false;

    for (let i = 0; i < lines.length; i++) {
        if (importLineSet.has(i) || sideEffectLineSet.has(i)) {
            // Count braces even in skipped lines to maintain depth
            for (const ch of lines[i]) {
                if (ch === "{") braceDepth++;
                if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
            }
            continue;
        }

        const trimmed = lines[i].trim();

        // Track declare module
        if (braceDepth === 0 && /^\s*declare\s+module\s+/.test(lines[i])) {
            inDeclareModule = true;
        }

        const prevDepth = braceDepth;
        for (const ch of lines[i]) {
            if (ch === "{") braceDepth++;
            if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
        }

        if (inDeclareModule) {
            if (braceDepth === 0) inDeclareModule = false;
            continue;
        }

        if (prevDepth !== 0) continue;

        // Match non-exported declarations: const/let/var/function
        const declMatch = trimmed.match(/^(?:const|let|var)\s+([A-Za-z_$]\w*)\s*=/);
        const funcMatch = !declMatch && trimmed.match(/^function\s+([A-Za-z_$]\w*)\s*\(/);

        if (declMatch || funcMatch) {
            const name = (declMatch || funcMatch)[1];
            // Find the extent of this declaration
            const blockEnd = findBlockEnd(lines, i);
            declarations.push({ startLine: i, endLine: blockEnd, name });
            i = blockEnd; // skip past
        }
    }

    // For each non-exported local, check if it's only used in side-effect code
    const seIds = findIdentifiers(seContentStr);
    const pureStr = pureContentLines.join("\n");

    for (const decl of declarations) {
        if (!seIds.has(decl.name)) continue; // not used in side effects at all

        // Check if used in pure content (excluding the declaration itself)
        const pureLinesWithoutDecl = [];
        for (let i = 0; i < lines.length; i++) {
            if (importLineSet.has(i) || sideEffectLineSet.has(i)) continue;
            if (i >= decl.startLine && i <= decl.endLine) continue;
            pureLinesWithoutDecl.push(lines[i]);
        }
        const pureWithoutDecl = pureLinesWithoutDecl.join("\n");
        const pureIds = findIdentifiers(stripDeclareModuleBlocks(pureWithoutDecl));

        if (!pureIds.has(decl.name)) {
            // Only used in side-effect code — move to wrapper
            result.push(decl);
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// Generate pure file and wrapper
// ---------------------------------------------------------------------------

function generateSplit(source, lines, imports, sideEffectBlocks, relPath) {
    // Create a set of line indices that belong to side-effect blocks
    const sideEffectLineSet = new Set();
    for (const block of sideEffectBlocks) {
        for (let i = block.startLine; i <= block.endLine; i++) {
            sideEffectLineSet.add(i);
        }
    }

    // Also mark import lines (we'll handle them separately)
    const importLineSet = new Set();
    for (const imp of imports) {
        for (let i = imp.startLine; i <= imp.endLine; i++) {
            importLineSet.add(i);
        }
    }

    // Collect pure content lines (excluding imports — we'll add those back)
    const pureContentLines = [];
    for (let i = 0; i < lines.length; i++) {
        if (importLineSet.has(i)) continue;
        if (sideEffectLineSet.has(i)) continue;
        pureContentLines.push(lines[i]);
    }

    // Collect side-effect content lines (excluding imports)
    const seContentLines = [];
    for (const block of sideEffectBlocks) {
        for (let i = block.codeStartLine; i <= block.endLine; i++) {
            seContentLines.push(lines[i]);
        }
    }

    const pureContentStr = pureContentLines.join("\n");
    const seContentStr = seContentLines.join("\n");

    // --- Detect local definitions only used by side-effect code ---
    // These need to move from pure to wrapper (e.g., `const InitSideEffects = () => { ... }`)
    const sideEffectOnlyLocals = findSideEffectOnlyLocals(lines, importLineSet, sideEffectLineSet, pureContentLines, seContentStr);

    // Add side-effect-only local blocks to the side-effect set
    for (const local of sideEffectOnlyLocals) {
        for (let i = local.startLine; i <= local.endLine; i++) {
            sideEffectLineSet.add(i);
        }
    }

    // Rebuild pure content after moving locals
    const pureContentLines2 = [];
    for (let i = 0; i < lines.length; i++) {
        if (importLineSet.has(i)) continue;
        if (sideEffectLineSet.has(i)) continue;
        pureContentLines2.push(lines[i]);
    }

    const pureContentStr2 = pureContentLines2.join("\n");

    // Rebuild side-effect content including moved locals
    const seContentLines2 = [];
    // First add moved locals (they need to come before usage)
    for (const local of sideEffectOnlyLocals) {
        for (let i = local.startLine; i <= local.endLine; i++) {
            seContentLines2.push(lines[i]);
        }
    }
    // Then add original side-effect blocks
    for (const block of sideEffectBlocks) {
        for (let i = block.codeStartLine; i <= block.endLine; i++) {
            seContentLines2.push(lines[i]);
        }
    }
    const seContentStr2 = seContentLines2.join("\n");

    // Analyze which imports are used in pure vs side-effect content
    // For pure content, strip declare module blocks to avoid false positives
    // (identifiers inside declare module augmentations aren't references to module-level imports)
    const pureUsage = analyzeImportUsage(imports, stripDeclareModuleBlocks(pureContentStr2));
    const seUsage = analyzeImportUsage(imports, seContentStr2);

    // Build pure file imports
    const pureImportLines = [];
    for (let idx = 0; idx < imports.length; idx++) {
        const imp = imports[idx];

        if (imp.isSideEffectOnly) {
            // Side-effect imports stay in pure (they're needed for module loading)
            // Actually, skip them — they're side effects themselves
            continue;
        }

        if (imp.isType) {
            // Type imports always go to pure (zero runtime cost)
            pureImportLines.push(imp.text);
            continue;
        }

        const pureNames = pureUsage.get(idx);
        const seNames = seUsage.get(idx);

        if (!pureNames && !seNames) {
            // Unused import — keep in pure to avoid breaking anything
            // (might be used in type annotations we didn't detect)
            pureImportLines.push(imp.text);
            continue;
        }

        if (pureNames) {
            if (imp.isNamespace || imp.isDefault) {
                // Can't split namespace/default imports
                pureImportLines.push(imp.text);
            } else {
                // Only keep names used in pure content
                const pureNameList = imp.names.filter((n) => pureNames.has(n.name));
                if (pureNameList.length > 0) {
                    const nameStr = pureNameList.map((n) => (n.alias ? `${n.name} as ${n.alias}` : n.name)).join(", ");
                    pureImportLines.push(`import { ${nameStr} } from "${imp.modulePath}";`);
                }
            }
        }
    }

    // Build pure file
    const pureLines2 = [...pureImportLines];
    if (pureImportLines.length > 0) pureLines2.push(""); // blank line after imports

    // Add non-import, non-side-effect content (using updated sideEffectLineSet)
    let startedContent = false;
    for (let i = 0; i < lines.length; i++) {
        if (importLineSet.has(i)) continue;
        if (sideEffectLineSet.has(i)) continue;
        pureLines2.push(lines[i]);
        startedContent = true;
    }

    // Trim trailing blank lines
    while (pureLines2.length > 0 && pureLines2[pureLines2.length - 1].trim() === "") {
        pureLines2.pop();
    }

    const pureContent = PURE_HEADER + pureLines2.join("\n") + "\n";

    // Find exported names from pure content
    const exportedFromPure = findExportedNames(pureLines2);

    // Build wrapper file
    const pureModulePath = "./" + basename(relPath).replace(/\.ts$/, ".pure");
    const wrapperLines = [];

    // Header comment
    wrapperLines.push(`/**`);
    wrapperLines.push(` * Re-exports pure implementation and applies runtime side effects.`);
    wrapperLines.push(` * Import ${basename(relPath).replace(/\.ts$/, ".pure")} for tree-shakeable, side-effect-free usage.`);
    wrapperLines.push(` */`);

    // Re-export everything from pure
    wrapperLines.push(`export * from "${pureModulePath}";`);
    wrapperLines.push(``);

    // Build wrapper imports
    const wrapperImports = [];

    // Import symbols needed from pure
    const neededFromPure = new Set();
    const seIds = findIdentifiers(seContentStr2);

    for (const name of exportedFromPure) {
        if (seIds.has(name)) {
            neededFromPure.add(name);
        }
    }

    if (neededFromPure.size > 0) {
        wrapperImports.push(`import { ${[...neededFromPure].sort().join(", ")} } from "${pureModulePath}";`);
    }

    // Import external symbols needed by side effects that aren't available from pure
    for (let idx = 0; idx < imports.length; idx++) {
        const imp = imports[idx];
        if (imp.isSideEffectOnly || imp.isType) continue;

        const seNames = seUsage.get(idx);
        if (!seNames) continue;

        // Find names that are needed by side effects but NOT exported from pure
        const externalNames = [];
        for (const nameObj of imp.names) {
            const localName = nameObj.alias || nameObj.name;
            if (seNames.has(nameObj.name) && !exportedFromPure.has(localName) && !neededFromPure.has(localName)) {
                // This name is needed by side effects and not available from pure
                // Check if it's already being imported from pure under a different guise
                if (!neededFromPure.has(nameObj.name)) {
                    externalNames.push(nameObj);
                }
            }
        }

        if (externalNames.length > 0) {
            if (imp.isNamespace) {
                wrapperImports.push(`import * as ${imp.names[0].alias} from "${imp.modulePath}";`);
            } else if (imp.isDefault) {
                wrapperImports.push(`import ${imp.names[0].alias} from "${imp.modulePath}";`);
            } else {
                const nameStr = externalNames.map((n) => (n.alias ? `${n.name} as ${n.alias}` : n.name)).join(", ");
                wrapperImports.push(`import { ${nameStr} } from "${imp.modulePath}";`);
            }
        }
    }

    // Also add type imports needed by side-effect code
    for (let idx = 0; idx < imports.length; idx++) {
        const imp = imports[idx];
        if (!imp.isType) continue;

        const seNames = seUsage.get(idx);
        if (!seNames) continue;

        // Type imports needed by side-effect type annotations
        const typeNames = imp.names.filter((n) => seNames.has(n.name));
        if (typeNames.length > 0) {
            const nameStr = typeNames.map((n) => (n.alias ? `${n.name} as ${n.alias}` : n.name)).join(", ");
            wrapperImports.push(`import type { ${nameStr} } from "${imp.modulePath}";`);
        }
    }

    for (const impLine of wrapperImports) {
        wrapperLines.push(impLine);
    }
    if (wrapperImports.length > 0) wrapperLines.push(``);

    // Add side-effect-only locals first (they need to precede the side-effect code)
    for (const local of sideEffectOnlyLocals) {
        for (let i = local.startLine; i <= local.endLine; i++) {
            wrapperLines.push(lines[i]);
        }
        wrapperLines.push(``);
    }

    // Add side-effect code blocks
    for (const block of sideEffectBlocks) {
        // Include leading comments
        for (let i = block.startLine; i <= block.endLine; i++) {
            wrapperLines.push(lines[i]);
        }
        wrapperLines.push(``);
    }

    // Trim trailing blank lines
    while (wrapperLines.length > 0 && wrapperLines[wrapperLines.length - 1].trim() === "") {
        wrapperLines.pop();
    }
    wrapperLines.push("");

    const wrapperContent = wrapperLines.join("\n");

    return { pureContent, wrapperContent };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    // Load manifest for initial filtering
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")).manifest;

    // Find candidates: files with side effects
    let candidates = manifest.filter((entry) => {
        if (entry.sideEffects.length === 0) return false;

        // Skip files in SKIP_FILES
        if (SKIP_FILES.has(entry.file)) return false;

        // Skip shader-only files (Shaders/ and ShadersWGSL/ dirs, or shader-store-write only)
        if (entry.file.startsWith("Shaders/") || entry.file.startsWith("ShadersWGSL/")) return false;
        const types = new Set(entry.sideEffects.map((s) => s.type));
        if (types.size === 1 && types.has("shader-store-write")) return false;

        // Skip declare-module-only files (already just type augmentations)
        if (types.size === 1 && types.has("declare-module")) return false;

        // Skip .pure.ts files (they shouldn't have side effects but might be in manifest)
        if (entry.file.endsWith(".pure.ts")) return false;

        return true;
    });

    // Filter by split status
    if (!RESPLIT) {
        candidates = candidates.filter((entry) => {
            const purePath = join(CORE_SRC, entry.file.replace(/\.ts$/, ".pure.ts"));
            return !existsSync(purePath);
        });
    }

    // Skip prototype-only files with no exports
    candidates = candidates.filter((entry) => {
        const types = new Set(entry.sideEffects.map((s) => s.type));
        // Only filter prototype-assignment-only files (no other side effect types)
        if (types.size === 1 && types.has("prototype-assignment")) {
            const content = readFileSync(join(CORE_SRC, entry.file), "utf-8");
            const hasExportedDecl = /^export\s+(class|interface|type|enum|function|const|let|var|abstract)\s/m.test(content);
            if (!hasExportedDecl) {
                if (VERBOSE) console.log(`  SKIP  ${entry.file} — prototype-only, no exports`);
                return false;
            }
        }
        return true;
    });

    if (SINGLE_FILE) {
        candidates = candidates.filter((entry) => entry.file === SINGLE_FILE);
        if (candidates.length === 0) {
            console.error(`File "${SINGLE_FILE}" not found in candidates.`);
            console.error(`(It may already have a .pure.ts — try --resplit)`);
            process.exit(1);
        }
    }

    console.log(`\n=== Side-Effect Splitter ${DRY_RUN ? "(DRY RUN)" : ""} ===\n`);
    console.log(`Found ${candidates.length} files to process.\n`);

    let processed = 0;
    let skipped = 0;
    const errors = [];

    for (const entry of candidates) {
        const filePath = join(CORE_SRC, entry.file);
        const source = readFileSync(filePath, "utf-8");
        const lines = source.split("\n");

        // Parse imports
        const imports = parseImports(lines);

        // Find side-effect blocks
        const blocks = findSideEffectBlocks(lines);

        if (blocks.length === 0) {
            if (VERBOSE) console.log(`  SKIP  ${entry.file} — no runtime side-effect blocks detected`);
            skipped++;
            continue;
        }

        // Check if there's any pure content left after removing side effects
        const sideEffectLineSet = new Set();
        for (const block of blocks) {
            for (let i = block.startLine; i <= block.endLine; i++) {
                sideEffectLineSet.add(i);
            }
        }
        const importLineSet = new Set();
        for (const imp of imports) {
            for (let i = imp.startLine; i <= imp.endLine; i++) {
                importLineSet.add(i);
            }
        }

        let hasPureContent = false;
        for (let i = 0; i < lines.length; i++) {
            if (importLineSet.has(i) || sideEffectLineSet.has(i)) continue;
            if (lines[i].trim() !== "") {
                hasPureContent = true;
                break;
            }
        }

        if (!hasPureContent) {
            if (VERBOSE) console.log(`  SKIP  ${entry.file} — no pure content after removing side effects`);
            skipped++;
            continue;
        }

        try {
            const { pureContent, wrapperContent } = generateSplit(source, lines, imports, blocks, entry.file);

            const pureFilePath = filePath.replace(/\.ts$/, ".pure.ts");

            if (DRY_RUN) {
                const typeStr = blocks.map((b) => b.type).join(", ");
                console.log(`  WOULD SPLIT  ${entry.file} (${blocks.length} side-effect blocks: ${typeStr})`);
                console.log(`    → ${relative(CORE_SRC, pureFilePath)}`);
                console.log(`    → ${entry.file} (wrapper)`);
                if (VERBOSE) {
                    console.log(
                        `    Wrapper:\n${wrapperContent
                            .split("\n")
                            .map((l) => "      " + l)
                            .join("\n")}`
                    );
                }
            } else {
                writeFileSync(pureFilePath, pureContent);
                writeFileSync(filePath, wrapperContent);
                if (VERBOSE) {
                    const typeStr = blocks.map((b) => b.type).join(", ");
                    console.log(`  SPLIT  ${entry.file} (${typeStr})`);
                }
            }

            processed++;
        } catch (err) {
            errors.push({ file: entry.file, error: err.message });
            console.error(`  ERROR  ${entry.file}: ${err.message}`);
            if (VERBOSE) console.error(err.stack);
        }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Processed: ${processed}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Errors:    ${errors.length}`);
    if (errors.length > 0) {
        console.log(`\nErrors:`);
        errors.forEach((e) => console.log(`  ${e.file}: ${e.error}`));
    }
}

main();
