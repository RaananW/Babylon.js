import {
    evaluateDisposePlaygroundScene,
    evaluateInitializePackageScene,
    evaluateInitializePlaygroundScene,
    evaluateMountViewerScenario,
    evaluateUnmountViewerScenario,
} from "../../src/browserActions";
import { getGlobalConfig } from "../../src/config";
import { createMemlabScenario, defaultScenarioDefinitions, resolveScenarioDefinitions } from "../../src/scenarios";
import { createMockFn } from "./testFramework";

const createPageMock = () => ({
    evaluate: createMockFn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(null).mockResolvedValueOnce(undefined).mockResolvedValueOnce(null),
    waitForFunction: createMockFn().mockResolvedValue(undefined),
    setViewport: createMockFn().mockResolvedValue(undefined),
});

describe("memory leak scenarios", () => {
    it("resolves the ci suite without package-only scenarios", () => {
        const scenarios = resolveScenarioDefinitions("ci");

        expect(scenarios.length).toBeGreaterThan(0);
        expect(scenarios.every((scenario) => scenario.packageName === "@babylonjs/core")).toBe(true);
    });

    it("resolves explicit scenario ids", () => {
        const scenarios = resolveScenarioDefinitions("all", ["viewer-boombox-web-component"]);

        expect(scenarios).toHaveLength(1);
        expect(scenarios[0].id).toBe("viewer-boombox-web-component");
    });

    it("creates a playground scenario that uses the deterministic browser actions", async () => {
        const definition = defaultScenarioDefinitions.find((scenario) => scenario.id === "core-playground-2FDQT5-1508");
        const config = getGlobalConfig();
        const scenario = createMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.beforeInitialPageLoad?.(page as any);
        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(scenario.url()).toContain("/empty.html");
        expect(scenario.repeat?.()).toBe(1);
        expect(page.setViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });
        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            evaluateInitializePlaygroundScene,
            expect.objectContaining({ playgroundId: "#2FDQT5#1508", exerciseAnimationGroups: true, settleAfterReadyMs: 150 })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, evaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 150 }));
    });

    it("creates a viewer scenario that uses the viewer mount helpers", async () => {
        const definition = defaultScenarioDefinitions.find((scenario) => scenario.id === "viewer-boombox-web-component");
        const config = getGlobalConfig();
        const scenario = createMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(scenario.url()).toContain("/packages/tools/viewer/test/apps/web/test.html");
        expect(page.evaluate).toHaveBeenNthCalledWith(1, evaluateMountViewerScenario, expect.objectContaining({ minFrameCount: 20, settleAfterReadyMs: 150 }));
        expect(page.evaluate).toHaveBeenNthCalledWith(3, evaluateUnmountViewerScenario, expect.objectContaining({ settleAfterDisposeMs: 150 }));
    });

    it("creates a package scenario on top of empty.html", async () => {
        const definition = defaultScenarioDefinitions.find((scenario) => scenario.id === "loaders-boombox-import");
        const config = getGlobalConfig();
        const scenario = createMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(scenario.url()).toContain("/empty.html");
        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            evaluateInitializePackageScene,
            expect.objectContaining({ scenario: "loaders-boombox-import", assetsUrl: expect.any(String) })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, evaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 250 }));
    });

    it("creates the new direct-load package scenario on top of empty.html", async () => {
        const definition = defaultScenarioDefinitions.find((scenario) => scenario.id === "loaders-obj-direct-load");
        const config = getGlobalConfig();
        const scenario = createMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            evaluateInitializePackageScene,
            expect.objectContaining({ scenario: "loaders-obj-direct-load", assetsUrl: expect.any(String) })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, evaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 150 }));
    });

    it("includes a heavier animation-driven playground in the ci suite", () => {
        const scenarios = resolveScenarioDefinitions("ci");

        expect(scenarios.some((scenario) => scenario.id === "core-playground-LL5BIQ-636")).toBe(true);
    });

    it("keeps inspector-driven playground interactions out of the ci suite", () => {
        const scenarios = resolveScenarioDefinitions("ci");

        expect(scenarios.some((scenario) => scenario.kind === "playground" && scenario.toggleInspector)).toBe(false);
    });

    it("focuses the packages suite on gui, loaders, and serializers with broader coverage per package", () => {
        const scenarios = resolveScenarioDefinitions("packages");

        expect(new Set(scenarios.map((scenario) => scenario.packageName))).toEqual(new Set(["@babylonjs/gui", "@babylonjs/loaders", "@babylonjs/serializers"]));
        expect(scenarios).toHaveLength(7);
    });
});
