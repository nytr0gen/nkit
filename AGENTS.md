# AGENTS.md

## Purpose

This file should be updated whenever work on the repo uncovers new Caido SDK quirks, workflow traps, or implementation caveats. Treat it as self-healing project memory, not static documentation.

This repository is a personal Caido utility plugin with:

- `packages/frontend`: Vue + PrimeVue UI running inside the Caido app
- `packages/backend`: Caido backend API handlers
- `caido.config.ts`: plugin packaging/configuration

Use this file as the working contract for any agent making changes in this repo.

## Project Structure

- Keep frontend work inside `packages/frontend`.
- Keep backend work inside `packages/backend`.
- Treat frontend/backend as a typed pair: frontend calls backend through the exported backend `API` type.
- Preserve the current plugin mounting pattern in `packages/frontend/src/index.ts`, including the prefixed root element used to avoid style collisions.
- The current plugin identity is `nkit`.
- Frontend feature wiring belongs in `packages/frontend/src/index.ts`.
- Replay URL behavior is organized under `packages/frontend/src/replayUrl`.

## Required Workflow

1. Read the relevant files before changing them.
2. Keep changes scoped to the package you are working in unless the feature clearly crosses frontend/backend boundaries.
3. After significant changes, run:
   - `pnpm lint`
   - `pnpm typecheck`
4. If a change removes or restructures code broadly, also run `pnpm knip`.
5. If you discover a new SDK limitation, shortcut caveat, or behavior trap while implementing or debugging, update this file in the same change.

## General Coding Rules

- Use TypeScript for all code changes.
- Use `type`, not `interface`.
- Do not use `any`.
- Do not cast to `any`.
- Prefer `undefined` over `null`.
- Avoid unnecessary `try`/`catch`.
- Do not add generated code comments unless the user explicitly asks for them.
- Keep abstractions minimal. Do not create helpers or alias types unless they materially improve the code.
- Declare variables close to where they are used.
- Colocate code that changes together.

## Naming and Organization

- Use camelCase for folders such as `httpHistory` or `intercept`.
- Use PascalCase for component folders.
- Use camelCase for non-component filenames.
- If a Vue component grows beyond a single file, prefer this structure:

```text
ComponentName/
  index.ts
  Container.vue
  useForm.ts
  DependentComponent.vue
```

- Re-export component entry points from `index.ts`.

## Frontend Rules

- Use Vue with `<script setup lang="ts">`.
- Prefer PrimeVue components for UI instead of custom controls.
- Match Caido's dark UI and use surface tokens for colors where possible.
- Keep the UI visually minimal; avoid introducing extra color.
- Use only Font Awesome solid icons in the form `fas fa-*`.
- Prefer `Card`, `Splitter`, `SplitterPanel`, and `DataTable` when they fit the interaction.
- Use friendly, minimal empty states.
- When displaying tabular data, prefer `DataTable` and place action columns last.

## Caido Frontend SDK Rules

- Use the documented SDK APIs directly.
- Do not add runtime checks like `if ("showToast" in sdk.window)`.
- Do not assume undocumented SDK methods exist.
- If the plugin has a backend, keep the frontend SDK typed with the backend `API` and `BackendEvents`.
- Commands are frontend-only and should be registered through the frontend SDK.
- Global shortcuts and command palette invocations run with `BaseContext`, not request-specific context.
- Do not assume a shortcut can access the currently selected request row or request pane unless it is attached to an editor extension that provides editor-local state.

## Backend Rules

- Register backend functions through `sdk.api.register(...)`.
- Export a typed `API` definition with `DefineAPI`.
- Prefer returning explicit result objects for recoverable failures instead of throwing.
- Keep backend functions focused on data processing, integration logic, and API endpoints.

## Caido-Specific Guidance

- This plugin runs inside Caido, not as a standalone web app.
- Frontend UI is rendered inside a Caido-managed panel/window.
- Frontend/backend communication should go through registered backend APIs.
- If working with requests/responses, use documented Caido SDK types and helpers directly.

## nkit Caveats

- The plugin route is `/nkit`.
- The frontend root element ID must stay aligned with the plugin ID: `plugin--nkit`.
- Replay URL feature command IDs currently use:
  - `nkit.copy-replay-url`
  - `nkit.paste-replay-url`
- `Copy URL` works through multiple supported paths:
  - `RequestContext` menu actions on request panes
  - `RequestRowContext` menu actions on request tables such as HTTP History
  - editor-local keybindings in Replay, HTTP History, and Automate request editors
- `RequestRowContext` is reliable for right-click row actions, but not for global shortcuts.
- HTTP History row selection alone is not enough for keyboard copy. The supported keyboard path is the readonly request editor that opens when a row is clicked.
- Automate copy uses the same request-editor-extension approach as HTTP History and Replay.
- Replay copy from editor falls back to backend request lookup for host, TLS, and port when the raw request only provides a relative target.
- Replay paste is intentionally side-effecting:
  - it does not patch the existing draft in place
  - it builds a fresh request from the pasted URL
  - it calls `sdk.replay.sendRequest(..., { overwriteDraft: true, ... })`
  - it therefore updates the Replay target and also sends the request
- Replay paste must work even on an empty Replay editor.
- Replay paste intentionally ignores the current raw editor contents and always builds its own request template.
- The current Replay paste request template is a fixed Chrome-style `GET` request with:
  - trimmed clipboard input
  - `https://` prefixed if no protocol is present
  - lower-case `sec-ch-ua*` headers
  - all other headers kept with normal case
- If the user changes the intended header template or browser fingerprint, update the template in `packages/frontend/src/replayUrl/utils.ts`.
- For request-row copy, fail closed when multiple rows are selected. Current behavior is “select exactly one request row”.

## Lint and Safety Notes

- The ESLint config is authoritative. Fix lint issues instead of working around them.
- Be explicit with nullable and empty string checks. Do not rely on loose falsy checks when the value can be a string.
- For derived Vue state, prefer `computed` instead of extra reactive state when possible.
- This workspace may not have installed dependencies. If `pnpm lint` or `pnpm typecheck` fail because `node_modules` is missing, say so explicitly instead of implying validation passed.

## Current Repo Context

- The repo is no longer just the untouched template.
- Current notable files:
  - frontend bootstrap at `packages/frontend/src/index.ts`
  - replay URL feature at `packages/frontend/src/replayUrl`
  - backend API registration at `packages/backend/src/index.ts`
- Keep new work aligned with this split unless the user requests a broader refactor.
