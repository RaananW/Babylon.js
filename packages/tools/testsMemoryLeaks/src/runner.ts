import type { ISerializedInfo } from "@memlab/core";
import type { RunOptions } from "memlab";
import { run } from "memlab";

import { getGlobalConfig, type GlobalConfig } from "./config";
import { createMemlabScenario, resolveScenarioDefinitions, type MemoryLeakScenarioDefinition, type ScenarioSuite } from "./scenarios";

/**
 * Options accepted by the Babylon memory leak runner.
 */
export interface MemoryLeakRunnerOptions {
    /** Scenario suite to execute. */
    suite?: ScenarioSuite;
    /** Optional explicit scenario ids. */
    scenarioIds?: string[];
    /** Override the shared global configuration. */
    configOverride?: Partial<GlobalConfig>;
    /** Whether to stop on the first failing scenario. */
    failFast?: boolean;
    /** Optional work directory override for memlab output. */
    workDir?: string;
    /** Optional Chromium binary override. */
    chromiumBinary?: string;
    /** Whether to skip the memlab warmup phase. */
    skipWarmup?: boolean;
}

/**
 * Result for a single scenario execution.
 */
export interface MemoryLeakScenarioResult {
    /** Scenario definition. */
    definition: MemoryLeakScenarioDefinition;
    /** Root directory containing the memlab artifacts. */
    resultDirectory: string;
    /** Serialized memlab leaks. */
    leaks: ISerializedInfo[];
}

/**
 * Error thrown when one or more memory leak scenarios fail.
 */
export class MemoryLeakRunnerError extends Error {
    /** Scenario results produced before the runner failed. */
    public readonly results: MemoryLeakScenarioResult[];

    /**
     * Creates a new runner error.
     * @param message Error message.
     * @param results Partial or complete runner results.
     */
    public constructor(message: string, results: MemoryLeakScenarioResult[] = []) {
        super(message);
        this.name = "MemoryLeakRunnerError";
        this.results = results;
    }
}

const formatLeakCountMessage = (definition: MemoryLeakScenarioDefinition, leaks: ISerializedInfo[], resultDirectory: string) => {
    return `${definition.id}: detected ${leaks.length} leak(s). Memlab artifacts: ${resultDirectory}`;
};

/**
 * Runs a single memory leak scenario.
 * @param definition The scenario definition.
 * @param options Runner options.
 * @param config Resolved global config.
 * @returns The scenario result.
 */
export async function runScenario(
    definition: MemoryLeakScenarioDefinition,
    options: MemoryLeakRunnerOptions = {},
    config: GlobalConfig = getGlobalConfig(options.configOverride)
): Promise<MemoryLeakScenarioResult> {
    const scenario = createMemlabScenario(definition, config);
    const memlabOptions: RunOptions = {
        scenario,
        chromiumBinary: options.chromiumBinary,
        skipWarmup: options.skipWarmup,
        workDir: options.workDir,
    };

    const { leaks, runResult } = await run(memlabOptions);

    return {
        definition,
        leaks,
        resultDirectory: runResult.getRootDirectory(),
    };
}

/**
 * Runs the selected scenario suite.
 * @param options Runner options.
 * @returns All scenario results.
 */
export async function runScenarioSuite(options: MemoryLeakRunnerOptions = {}): Promise<MemoryLeakScenarioResult[]> {
    const config = getGlobalConfig(options.configOverride);
    const definitions = resolveScenarioDefinitions(options.suite ?? "ci", options.scenarioIds);
    const results: MemoryLeakScenarioResult[] = [];

    for (const definition of definitions) {
        const result = await runScenario(definition, options, config);
        results.push(result);

        if (result.leaks.length > 0) {
            const message = formatLeakCountMessage(definition, result.leaks, result.resultDirectory);
            if (options.failFast ?? true) {
                throw new MemoryLeakRunnerError(message, results);
            }
            console.error(message);
        }
    }

    const failingResults = results.filter((result) => result.leaks.length > 0);
    if (failingResults.length > 0) {
        throw new MemoryLeakRunnerError(failingResults.map((result) => formatLeakCountMessage(result.definition, result.leaks, result.resultDirectory)).join("\n"), results);
    }

    return results;
}
