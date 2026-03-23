export * from "./browserActions";
export * from "./cli";
export * from "./config";
export * from "./filters";
export * from "./runner";
export * from "./scenarios";

if (require.main === module) {
    void import("./cli").then(async ({ runCli }) => {
        await runCli(process.argv.slice(2));
    });
}
