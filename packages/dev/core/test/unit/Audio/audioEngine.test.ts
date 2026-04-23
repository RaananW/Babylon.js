/**
 * @vitest-environment jsdom
 */

import { AudioEngine } from "core/Audio";
import { AbstractEngine, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Sound } from "core/Audio/sound";

import { type AudioContextMock, MockedAudioObjects } from "./helpers/mockedAudioObjects";

import { AudioTestSamples } from "./helpers/audioTestSamples";
import { AudioTestHelper } from "./helpers/audioTestHelper";

function createAudioEngine(state: string): AudioEngine {
    const audioContext = new AudioContext();
    (audioContext as any).state = state;
    return (AbstractEngine.audioEngine = new AudioEngine(null, audioContext, null));
}

describe("AudioEngine", () => {
    AudioTestSamples.Initialize();

    let engine: NullEngine;
    let mock: MockedAudioObjects;
    let scene: Scene;

    beforeEach(() => {
        mock = new MockedAudioObjects();
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        mock.dispose();
        (mock as any) = null;

        scene.dispose();
        (scene as any) = null;

        engine.dispose();
        (engine as any) = null;
    });

    it("unlocked is initialized to false when browser requires user interaction", () => {
        const audioEngine = createAudioEngine("suspended");

        expect(audioEngine.unlocked).toBe(false);
    });

    it("unlocked is initialized to true when browser does not require user interaction", async () => {
        const audioEngine = createAudioEngine("running");

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error("AudioEngine unlocked event was not fired."));
            }, 1000);
            audioEngine.onAudioUnlockedObservable.addOnce(() => {
                resolve(true);
            });
        });

        return AudioTestHelper.WhenAudioContextResumes(() => {
            expect(audioEngine.unlocked).toBe(true);
        });
    });

    it("should not show mute button until a sound plays when browser requires user interaction", () => {
        vi.useFakeTimers();

        const audioEngine = createAudioEngine("suspended");
        (audioEngine._v2._audioContext as unknown as AudioContextMock).requireUserInteraction = true;

        const arrayBuffer = AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName!, arrayBuffer);

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("none");

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("block");
    });

    it("should not show mute button when sound plays and browser does not require user interaction", () => {
        vi.useFakeTimers();

        const audioEngine = createAudioEngine("running");

        const arrayBuffer = AudioTestSamples.GetArrayBuffer("silence, 1 second, 1 channel, 48000 kHz");
        const sound = new Sound(expect.getState().currentTestName!, arrayBuffer);

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("none");

        sound.play();
        AudioTestHelper.WaitForAudioContextSuspendedDoubleCheck();

        expect((audioEngine._v2 as any)._unmuteUI._button.style.display).toBe("none");
    });

    it("resumeAsync clears cached promise on failure so subsequent calls can retry", async () => {
        const audioEngine = createAudioEngine("running");
        const audioContextMock = audioEngine._v2._audioContext as unknown as AudioContextMock;

        // Simulate the context being suspended (e.g. by OS during background).
        audioContextMock.state = "suspended";

        // First call to resumeAsync rejects with InvalidStateError.
        const error = new DOMException("Failed to start the audio device", "InvalidStateError");
        audioContextMock.resume.mockImplementationOnce(() => Promise.reject(error));

        await expect(audioEngine._v2.resumeAsync()).rejects.toThrow("Failed to start the audio device");

        // The cached promise should be cleared so the next call retries.
        expect((audioEngine._v2 as any)._resumePromise).toBeNull();

        // State is still "suspended" but now returns "running" on resume.
        audioContextMock.resume.mockImplementationOnce(() => {
            audioContextMock.state = "running";
            return Promise.resolve();
        });

        // The state is still "suspended" so resumeAsync creates a new deferred promise.
        // We need to simulate the statechange to resolve it.
        const resumePromise = audioEngine._v2.resumeAsync();
        // Trigger statechange to resolve the deferred promise since state is now "running".
        const statechangeCall = audioContextMock.addEventListener.mock.calls.find((c: any[]) => c[0] === "statechange");
        if (statechangeCall) {
            statechangeCall[1]();
        }

        await expect(resumePromise).resolves.toBeUndefined();
    });

    it("resumeAsync resolves when context reaches running via user gesture after hanging resume", async () => {
        const audioEngine = createAudioEngine("running");
        const audioContextMock = audioEngine._v2._audioContext as unknown as AudioContextMock;

        // Simulate the context being suspended (e.g. by OS during background).
        audioContextMock.state = "suspended";

        // Simulate iOS Safari: resume() returns a promise that never resolves.
        audioContextMock.resume.mockImplementationOnce(() => new Promise<void>(() => {}));

        const resumePromise = audioEngine._v2.resumeAsync();

        // The promise should be pending (not resolved, not rejected).
        expect((audioEngine._v2 as any)._resumePromise).not.toBeNull();

        // Simulate user gesture triggering a successful context resume via statechange.
        audioContextMock.state = "running";
        const statechangeCall = audioContextMock.addEventListener.mock.calls.find((c: any[]) => c[0] === "statechange");
        expect(statechangeCall).toBeDefined();
        statechangeCall![1]();

        // The deferred promise should now resolve.
        await expect(resumePromise).resolves.toBeUndefined();
        expect((audioEngine._v2 as any)._resumePromise).toBeNull();
    });
});
