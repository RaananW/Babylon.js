/**
 * Playground MCP Server – Session Server unit tests.
 *
 * Validates the HTTP + SSE session server: session lifecycle, code push/pull,
 * SSE broadcasting, and CORS. Uses real HTTP requests against the running server.
 *
 * Run with: npx jest --testPathPattern playground-mcp-server
 */

import { PlaygroundManager } from "../../src/playgroundManager";
import {
    startSessionServer,
    stopSessionServer,
    createSession,
    getSessionForPlayground,
    getSessionUrl,
    notifySessionUpdate,
    closeSession,
    closeSessionForPlayground,
    isSessionServerRunning,
} from "../../src/sessionServer";

// ── Helpers ───────────────────────────────────────────────────────────────

let manager: PlaygroundManager;
let port: number;

async function fetchJSON(url: string, init?: RequestInit): Promise<{ status: number; body: any }> {
    const res = await fetch(url, init);
    const body = await res.json();
    return { status: res.status, body };
}

// ── Setup / Teardown ──────────────────────────────────────────────────────

beforeAll(async () => {
    manager = new PlaygroundManager();
    // Use a high port to avoid conflicts
    port = await startSessionServer(manager, 13002);
});

afterAll(async () => {
    await stopSessionServer();
});

beforeEach(() => {
    // Create a fresh playground for each test
    manager.createPlayground("testPg", "JS", "// initial code");
});

afterEach(() => {
    // Clean up playgrounds and sessions
    closeSessionForPlayground("testPg");
    manager.deletePlayground("testPg");
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe("Session Server", () => {
    describe("server lifecycle", () => {
        it("reports running after start", () => {
            expect(isSessionServerRunning()).toBe(true);
        });

        it("returns a valid port number", () => {
            expect(port).toBeGreaterThanOrEqual(13002);
            expect(port).toBeLessThanOrEqual(13011);
        });
    });

    describe("session management", () => {
        it("creates a session and returns a session ID", () => {
            const sid = createSession("testPg");
            expect(typeof sid).toBe("string");
            expect(sid.length).toBe(8); // 4 bytes hex
        });

        it("returns the same session ID for the same playground", () => {
            const sid1 = createSession("testPg");
            const sid2 = createSession("testPg");
            expect(sid1).toBe(sid2);
        });

        it("getSessionForPlayground returns the session ID", () => {
            const sid = createSession("testPg");
            expect(getSessionForPlayground("testPg")).toBe(sid);
        });

        it("getSessionForPlayground returns undefined when no session", () => {
            expect(getSessionForPlayground("nonExistent")).toBeUndefined();
        });

        it("getSessionUrl returns a valid URL", () => {
            const sid = createSession("testPg");
            const url = getSessionUrl(sid, port);
            expect(url).toBe(`http://localhost:${port}/session/${sid}`);
        });

        it("closeSession closes an existing session", () => {
            const sid = createSession("testPg");
            expect(closeSession(sid)).toBe(true);
            expect(getSessionForPlayground("testPg")).toBeUndefined();
        });

        it("closeSession returns false for non-existent session", () => {
            expect(closeSession("deadbeef")).toBe(false);
        });

        it("closeSessionForPlayground closes by name", () => {
            createSession("testPg");
            expect(closeSessionForPlayground("testPg")).toBe(true);
            expect(getSessionForPlayground("testPg")).toBeUndefined();
        });

        it("closeSessionForPlayground returns false when no session", () => {
            expect(closeSessionForPlayground("nonExistent")).toBe(false);
        });
    });

    describe("HTTP routes", () => {
        it("GET / returns status page", async () => {
            const res = await fetch(`http://localhost:${port}/`);
            expect(res.status).toBe(200);
            const text = await res.text();
            expect(text).toContain("Playground MCP Session Server");
        });

        it("OPTIONS returns 204 with CORS headers", async () => {
            const sid = createSession("testPg");
            const res = await fetch(`http://localhost:${port}/session/${sid}/code`, { method: "OPTIONS" });
            expect(res.status).toBe(204);
            expect(res.headers.get("access-control-allow-origin")).toBe("*");
        });

        it("GET /session/:id returns session info", async () => {
            const sid = createSession("testPg");
            const { status, body } = await fetchJSON(`http://localhost:${port}/session/${sid}`);
            expect(status).toBe(200);
            expect(body.sessionId).toBe(sid);
            expect(body.playgroundName).toBe("testPg");
            expect(body.eventsUrl).toContain("events");
            expect(body.codeUrl).toContain("code");
        });

        it("GET /session/:id/code returns playground code as JSON", async () => {
            const sid = createSession("testPg");
            const { status, body } = await fetchJSON(`http://localhost:${port}/session/${sid}/code`);
            expect(status).toBe(200);
            expect(body.code).toBe("// initial code");
            expect(body.language).toBe("JS");
        });

        it("POST /session/:id/code updates playground code", async () => {
            const sid = createSession("testPg");
            const payload = JSON.stringify({ code: "// updated via POST", language: "JS" });
            const { status, body } = await fetchJSON(`http://localhost:${port}/session/${sid}/code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            });
            expect(status).toBe(200);
            expect(body.ok).toBe(true);

            // Verify the manager was updated
            expect(manager.getCode("testPg")).toBe("// updated via POST");
        });

        it("POST /session/:id/code rejects invalid JSON", async () => {
            const sid = createSession("testPg");
            const { status, body } = await fetchJSON(`http://localhost:${port}/session/${sid}/code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "not valid json{{{",
            });
            expect(status).toBe(400);
            expect(body.error).toContain("Invalid JSON");
        });

        it("returns 404 for unknown session", async () => {
            const { status } = await fetchJSON(`http://localhost:${port}/session/deadbeef/code`);
            expect(status).toBe(404);
        });

        it("returns 404 for unknown routes", async () => {
            const res = await fetch(`http://localhost:${port}/unknown`);
            expect(res.status).toBe(404);
        });
    });

    describe("SSE", () => {
        it("GET /session/:id/events returns text/event-stream", async () => {
            const sid = createSession("testPg");
            const controller = new AbortController();
            const res = await fetch(`http://localhost:${port}/session/${sid}/events`, {
                signal: controller.signal,
            });
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toContain("text/event-stream");
            controller.abort();
        });

        it("receives updates via SSE when notifySessionUpdate is called", async () => {
            const sid = createSession("testPg");
            const controller = new AbortController();

            // Connect SSE
            const res = await fetch(`http://localhost:${port}/session/${sid}/events`, {
                signal: controller.signal,
            });
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();

            // Read initial ": connected" comment
            const { value: chunk1 } = await reader.read();
            const initial = decoder.decode(chunk1);
            expect(initial).toContain("connected");

            // Update the code and notify
            manager.setCode("testPg", "// updated via notify");
            notifySessionUpdate(sid);

            // Read the SSE data event
            const { value: chunk2 } = await reader.read();
            const eventData = decoder.decode(chunk2);
            expect(eventData).toContain("data:");
            expect(eventData).toContain("// updated via notify");

            controller.abort();
        });
    });
});
