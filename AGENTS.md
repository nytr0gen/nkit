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
- HTTP History behavior is organized under `packages/frontend/src/httpHistory`.
- Replay URL behavior is organized under `packages/frontend/src/replayUrl`.
- nvertor Replay templating behavior is organized under `packages/frontend/src/nvertor`.

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
- The published `@caido/sdk-frontend` root typings may lag behind documented runtime APIs.
- When that happens, keep the stronger local wrapper in `packages/frontend/src/caido.ts` aligned with the docs/runtime instead of using `any` casts.

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
- Caido does not currently expose a supported API to change the default built-in HTTP History request tab from `Original Request` to another built-in variant.
- The current HTTP History customization is a supported custom request view mode labeled `Final`.
- Caido's `sdk.ui.httpRequestEditor()` is not a reliable generic "load arbitrary raw request text into a custom pane" API.
- The `Final` view therefore uses a self-owned read-only CodeMirror viewer with lightweight HTTP highlighting instead of trying to embed Caido's built-in request editor.
- Imported frontend CSS is prefix-wrapped under `#plugin--nkit` by the build config.
- That means imported CSS will not affect Caido-hosted panes outside the plugin root, such as HTTP History view modes rendered in core UI containers.
- For those cases, inject a guarded global `<style>` tag at runtime instead of relying on a normal imported stylesheet.
- Useful DOM-hack learnings from the reverted HTTP History tab experiment:
  - the request alteration control is a PrimeVue `Select`, not a native `<select>`
  - the stable DOM entry point was the combobox with `aria-label="Request alteration"`
  - the overlay list was linked through `aria-controls`
  - bounded frame-based waits worked better than fixed `setTimeout` sleeps
  - clicking the built-in dropdown changed focus in undesirable ways
  - any future DOM hack here should fail closed if selectors or focus behavior drift
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
- In `packages/frontend/src/replayUrl/utils.ts`, prefer `new URL(...)` with a narrow compat lint suppression when needed; do not switch back to anchor-element URL parsing.
- nvertor is Replay-only in v1.
- nvertor keeps `<@...>` tags in the Replay editor and renders the converted output in the custom Replay request view mode labeled `Converted`.
- Caido does not currently expose a supported pre-send hook for the built-in Replay send action.
- Because of that, transformed Replay sending must go through the plugin-owned `Send Converted Request` action or the Replay editor `Mod-Enter` keybinding.
- `Copy Converted Request` is registered as a `RequestContext` menu item but must stay gated to the Replay page through the command `when(...)` handler.
- The nvertor transform registry lives in `packages/frontend/src/nvertor/render.ts`; add new functions there instead of adding one-off parser branches.
- nvertor generator tags such as `uuid` and `ts` should accept both `<@tag>` and `<@tag/>`; do not require closing tags for generators.
- nvertor transform tags may use the exact wildcard closing form `</@>` to close the current open transform; named closing tags should stay strict and must still match the current transform when present.
- `repeat` is a transform-only nvertor tag with required integer argument syntax `<@repeat(n)>...</@>`; allow `0`, reject spaces/decimals/negatives, and fail closed above `10000`.
- `htmld` must stay a pure string/entity decoder in `packages/frontend/src/nvertor/render.ts`; do not reintroduce DOM parsing through `innerHTML` or `DOMParser`.
- nvertor preview, copy, and send rerender from the current template source each time; do not cache rendered results just to stabilize `uuid` or `ts`.
- Replay editor text is normalized to `\n`, so nvertor must convert rendered requests back to HTTP `\r\n` before copy/send or Replay history may display the sent request as a single line.
- nvertor should not rewrite `Content-Length` inside the renderer; rely on `sdk.replay.sendRequest(..., { updateContentLength: true })` for converted sends.
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
  - HTTP History feature at `packages/frontend/src/httpHistory`
  - replay URL feature at `packages/frontend/src/replayUrl`
  - backend API registration at `packages/backend/src/index.ts`
- Keep new work aligned with this split unless the user requests a broader refactor.
