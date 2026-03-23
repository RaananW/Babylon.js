import { defaultScenarioDefinitions, type ScenarioSuite } from "./scenarios";
import { runScenarioSuite, type MemoryLeakRunnerOptions } from "./runner";

const getArgValue = (argv: string[], name: string): string | undefined => {
    const prefixedArg = `--${name}=`;
    const directMatch = argv.find((arg) => arg.startsWith(prefixedArg));
    if (directMatch) {
        return directMatch.slice(prefixedArg.length);
    }

    const index = argv.indexOf(`--${name}`);
    if (index !== -1 && index + 1 < argv.length) {
        return argv[index + 1];
    }

    return undefined;
};

/**
 * Parses CLI arguments for the memory leak runner.
 * @param argv Raw process arguments.
 * @returns Parsed runner options and control flags.
 */
export function parseCliArgs(argv: string[]) {
    const suite = (getArgValue(argv, "suite") as ScenarioSuite | undefined) ?? "ci";
    const scenarioArg = getArgValue(argv, "scenario");
    const scenarioIds = scenarioArg
        ?.split(",")
        .map((scenarioId) => scenarioId.trim())
        .filter(Boolean);
    const workDir = getArgValue(argv, "work-dir");
    const chromiumBinary = getArgValue(argv, "chromium-binary");
    const failFast = !argv.includes("--no-fail-fast");
    const listOnly = argv.includes("--list");
    const skipWarmup = argv.includes("--skip-warmup");

    const options: MemoryLeakRunnerOptions = {
        suite,
        scenarioIds,
        workDir,
        chromiumBinary,
        failFast,
        skipWarmup,
    };

    return { listOnly, options };
}

/**
 * Executes the memory leak runner CLI.
 * @param argv Raw process arguments.
 */
export async function runCli(argv: string[]): Promise<void> {
    const { listOnly, options } = parseCliArgs(argv);

    if (listOnly) {
        defaultScenarioDefinitions.forEach((definition) => {
            console.log(`${definition.id}\t${definition.packageName}\t${definition.suites.join(",")}\t${definition.name}`);
        });
        return;
    }

    const results = await runScenarioSuite(options);
    results.forEach((result) => {
        console.log(`${result.definition.id}: 0 leak(s). Memlab artifacts: ${result.resultDirectory}`);
    });
}
