# Babylon Memory Leak Tests

This package contains the Babylon.js memlab-based memory leak runner.

## Goals

- Keep the existing memlab workflow.
- Make the browser interaction phase deterministic enough for CI.
- Separate fast CI-safe coverage from broader cross-package scenarios.
- Keep scenario definitions testable and easy to extend.

## Suites

- `ci`: the PR-facing Babylon Server suite. This is the first-class memory-leak suite intended to run on every PR through the root `test:memory-leaks` entrypoint.
- `extended`: additional Babylon Server playground scenarios that are useful locally but increase runtime.
- `packages`: package-focused scenarios for `@babylonjs/gui`, `@babylonjs/loaders`, and `@babylonjs/serializers`, all hosted on top of Babylon Server `empty.html`.
  The current coverage includes fullscreen GUI, mesh-attached GUI, remote glTF loading, direct OBJ/STL loading, and both glTF and GLB export paths.
- `all`: every scenario in this package.

## Running

Package unit tests for the memory leak harness:

```sh
npm run test:unit -w @tools/memory-leak-tests
```

This script is intentionally merge-safe around `#18136`:

- on the current branch it runs the package's Jest unit tests
- after the Vitest migration lands it will switch to Vitest automatically when `vitest` is available

Core CI-oriented suite:

```sh
npm run test -w @tools/memory-leak-tests
```

All scenarios:

```sh
npm run test:all -w @tools/memory-leak-tests
```

Package-focused scenarios only:

```sh
npm run test:packages -w @tools/memory-leak-tests
```

List scenarios:

```sh
npm run list -w @tools/memory-leak-tests
```

Run a specific scenario:

```sh
npm run test -w @tools/memory-leak-tests -- --scenario core-playground-2FDQT5-1508
```

## Required servers

The `ci` and `extended` suites expect the Babylon server at `http://localhost:1337` unless `CDN_BASE_URL` is set.

In this workspace, the relevant task is:

- `CDN Serve and watch (Dev)` for Babylon Server content.

The viewer web component scenario is still available by explicit id, but it is no longer part of the default `packages` suite because it depends on a separate Vite dev server.

## Why this is more stable

The old runner loaded scenarios through `test.html`, a start button, a dynamically appended script, and a dispose button that only called `LastCreatedEngine.dispose()`. That made the browser interaction layer hard to test and easy to race.

The updated runner:

- Uses explicit memlab scenario definitions instead of hardcoded anonymous closures.
- Loads core scenarios on top of `empty.html`, which already exposes the Babylon bundles without extra UI state.
- Creates and disposes the engine and scene directly inside the memlab action and back callbacks.
- Waits for the browser to settle after scene readiness and after disposal so memlab snapshots are less likely to race async teardown work.
- Exercises animation-heavy scenes by briefly starting and stopping animation groups before snapshots are taken.
- Keeps inspector-driven interactions out of the `ci` suite because the legacy inspector currently retains a static scene reference after `hide()`, which would make the PR gate fail for the wrong reason.
- Runs the current package-focused scenarios on the same stable Babylon Server host page instead of depending on separate package dev servers.
- Tracks a small browser-side harness state so the runner can wait for the page to become idle before memlab snapshots are taken.
- Separates core CI-safe scenarios from slower or package-specific scenarios.

## Adding a new scenario

1. Add a new definition in `src/scenarios.ts`.
2. Reuse one of the existing scenario kinds if possible:
    - `playground` for Babylon Server scenes loaded from Playground snippets.
    - `viewer` for the viewer custom element test app.
    - `package` for deterministic package API coverage on `empty.html`.
3. Put the scenario in the smallest suite that still gives useful coverage.
4. Prefer deterministic teardown paths. If a package app cannot cleanly undo its action, do not add it to the `ci` suite.
5. Add or update unit tests for the scenario selection or factory logic.

## PR Coverage

Use the root `test:memory-leaks` script for the dedicated PR memory-leak gate:

```sh
npm run test:memory-leaks
```

Use the root `test:memory-leaks:unit` script for the harness unit tests:

```sh
npm run test:memory-leaks:unit
```

In this branch, `test:integration` also chains into the same `ci` suite so the memory leak runner is not treated as a one-off local tool.
