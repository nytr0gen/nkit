# AGENTS.md

## Purpose

This file should be updated whenever work on the repo uncovers new Caido SDK quirks, workflow traps, or implementation caveats. Treat it as self-healing project memory, not static documentation.

This repository is a personal Caido utility plugin with:

- `packages/frontend`: Vue + PrimeVue UI running inside the Caido app
- `packages/backend`: Caido backend API handlers
- `packages/workflows`: packaged Caido workflow sources
- `caido.config.ts`: plugin packaging/configuration

Use this file as the working contract for any agent making changes in this repo.

## Project Structure

- Keep frontend work inside `packages/frontend`.
- Keep backend work inside `packages/backend`.
- Keep packaged workflow sources inside `packages/workflows`.
- Treat frontend/backend as a typed pair: frontend calls backend through the exported backend `API` type.
- Preserve the current plugin mounting pattern in `packages/frontend/src/index.ts`, including the prefixed root element used to avoid style collisions.
- The current plugin identity is `nkit`.
- Frontend feature wiring belongs in `packages/frontend/src/index.ts`.
- HTTP History behavior is organized under `packages/frontend/src/httpHistory`.
- Replay URL behavior is organized under `packages/frontend/src/replayUrl`.
- nvertor Replay templating behavior is organized under `packages/frontend/src/nvertor`.
- The nvertor Match and Replace Convert workflow is organized under `packages/workflows/src/nvertor-convert`.

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
- The documented/runtime `addRequestEditorExtension(...)` hooks for Findings, Sitemap, and Search are missing from the pinned frontend SDK typings; keep them in the local wrapper so editor-local shortcuts can be registered on those pages.
- Match and Replace is one current example of that lag: the documented/runtime `addToSlot(...)`, `getCurrentRule()`, `onCurrentRuleChange(...)`, `toggleRule(...)`, and slot constants may not all exist in the published package typings, so keep the local wrapper aligned there too.

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
  - editor-local keybindings in Replay, HTTP History, Automate, Findings, Sitemap, and Search request editors
- `RequestRowContext` is reliable for right-click row actions, but not for global shortcuts.
- Table row selection alone is not enough for keyboard copy. The supported keyboard path is the readonly request editor that opens when a row is clicked; this applies to HTTP History, Findings, Sitemap, and Search.
- Caido does not currently expose a supported API to change the default built-in HTTP History request tab from `Original Request` to another built-in variant.
- The old custom HTTP History `Final` request view mode was removed; the active customization is now the `Ctrl/Cmd+Shift+E` request-alteration toggle plus the global CSS override for the pane header text width.
- Imported frontend CSS is prefix-wrapped under `#plugin--nkit` by the build config.
- That means imported CSS will not affect Caido-hosted panes outside the plugin root, such as HTTP History view modes rendered in core UI containers.
- For those cases, inject a guarded global `<style>` tag at runtime instead of relying on a normal imported stylesheet.
- The Replay session-tab `HTTP` tag is hidden by guarded global CSS in `packages/frontend/src/replayUrl/register.ts`. Its selector depends on Caido's current tab DOM structure; if Replay tab names disappear after a Caido update, inspect or remove this rule first.
- Useful DOM-hack learnings from the reverted HTTP History tab experiment:
  - the request alteration control is a PrimeVue `Select`, not a native `<select>`
  - the stable DOM entry point was the combobox with `aria-label="Request alteration"`
  - the overlay list was linked through `aria-controls`
  - bounded frame-based waits worked better than fixed `setTimeout` sleeps
  - the HTTP History `Ctrl/Cmd+Shift+E` toggle should prefer a normal Caido command plus `sdk.shortcuts.register(...)` gated to `sdk.window.getContext().page?.kind === "HTTPHistory"`; it does not need a document-level keydown listener now that the action only depends on page context plus DOM lookup
  - the toggle cycles the next visible request-alteration option through that combobox rather than targeting a single fixed label
  - clicking the built-in dropdown changes focus unless a request editor element is explicitly refocused after the option click
  - any future DOM hack here should fail closed if selectors or focus behavior drift
- Automate copy uses the same request-editor-extension approach as HTTP History and Replay.
- Findings, Sitemap, and Search copy use that same request-editor-extension approach.
- Replay copy from editor falls back to backend request lookup for host, TLS, and port when the raw request only provides a relative target.
- Replay paste is intentionally side-effecting:
  - it does not patch the existing draft in place
  - on Caido 0.57+, it builds a fresh request and Replay session from the pasted URL, keeping the current collection when possible
  - it waits for `sdk.replay.onSessionCreate(...)` because `createSession(...)` does not return the created session ID
  - it sends the new session through the draft-based `sdk.replay.sendRequest(...)`
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
- Match and Replace rule duplication is implemented as a documented `MatchReplaceSlot.UpdateHeader` button, not a DOM hack or context-menu hack.
- Duplicate rule naming should stay collection-local and use the next trailing numeric suffix: `Rule`, `Rule 2`, `Rule 3`, ...
- nvertor keeps `<@...>` tags in the Replay editor and renders the converted output in the custom Replay request view mode labeled `Converted`.
- nvertor transformed sends go through the packaged `nvertor Convert` workflow plus a user-created Match and Replace rule: `Request Raw`, `Full`, `Workflow: nvertor Convert`, source `Replay`.
- nvertor does not own Replay sending or bind `Ctrl/Cmd+Enter`; Caido's native send action applies the Match and Replace workflow while leaving the tagged draft in the editor.
- Caido 0.57 removed `raw`, `connectionInfo`, `overwriteDraft`, and `updateContentLength` from the published frontend `SendRequestOptions`; `sdk.replay.sendRequest(...)` now sends the session's current draft and only exposes the `background` option. A local compatibility type for the older signature can hide this runtime break, and the generated online Replay reference may lag behind the published package typings.
- Caido 0.57's GraphQL `startReplayTask` mutation is also draft-based and accepts only a Replay session ID. Using GraphQL to send converted raw text would still require mutating the Replay entry draft first (including its connection, editor state, and settings), so it is not a direct replacement for the removed frontend send options.
- Backend `sdk.events.onUpstream(...)` is only invoked when the plugin is enabled for the request domain in Caido's Upstream Plugins settings, and it can replace the outgoing request with a `RequestSpec` before the target is contacted.
- Caido 0.57's frontend GraphQL schema exposes upstream-plugin query/create/update operations with `enabled`, `allowlist`, and `denylist` fields. Treat that configuration as shared network state rather than page-local UI state; do not couple it directly to Replay page visibility.
- A Match and Replace `Workflow` replacer runs a Convert workflow on the bytes matched by that rule. Current Caido exposes `Request Raw`, so a `Full` matcher passes the complete raw request to nvertor in one workflow invocation.
- Caido sends an empty replacement when a Match and Replace workflow throws. The nvertor workflow must catch runtime failures and return the original input; parser or transform errors must also return the original input instead of throwing.
- Caido plugin manifests support `kind: "workflow"` components, but `@caido-community/dev` 0.1.6 currently accepts workflow entries in `caido.config.ts` and then omits them while building the package because its build/bundle path only emits frontend and backend outputs. The root build therefore runs `scripts/packageWorkflow.mjs` after `caido-dev build` to compile the workflow, append it to the manifest, and rebuild the ZIP.
- `pnpm watch` does not run the workflow packaging postprocessor. After changing workflow code or its shared renderer, run `pnpm build` and reinstall the generated package to test the packaged workflow.
- `Copy Converted Request` is registered as a `RequestContext` menu item but must stay gated to the Replay page through the command `when(...)` handler.
- The nvertor transform registry and conversion engine live in `packages/workflows/src/nvertor-convert/render.ts`. The workflow owns this implementation and the frontend imports it for preview and copy behavior; do not make the workflow depend on frontend/plugin code.
- The nvertor renderer must remain standalone and compatible with Caido's QuickJS workflow runtime. Avoid browser-only globals such as `window`, `document`, `btoa`, `atob`, `TextEncoder`, `TextDecoder`, or Web Crypto in that module.
- nvertor generator tags such as `uuid` and `ts` should accept both `<@tag>` and `<@tag/>`; do not require closing tags for generators.
- nvertor transform tags may use the exact wildcard closing form `</@>` to close the current open transform; named closing tags should stay strict and must still match the current transform when present.
- `repeat` and its exact alias `loop` are transform-only nvertor tags with required integer argument syntax such as `<@repeat(n)>...</@>` or `<@loop(n)>...</@>`; allow `0`, reject spaces/decimals/negatives, and fail closed above `10000`.
- `htmld` must stay a pure string/entity decoder in `packages/workflows/src/nvertor-convert/render.ts`; do not reintroduce DOM parsing through `innerHTML` or `DOMParser`.
- nvertor preview, copy, and workflow execution rerender from their current template input each time; do not cache rendered results just to stabilize `uuid` or `ts`.
- Replay editor text is normalized to `\n`, so copied converted requests must be converted back to HTTP `\r\n` or Replay history may display them as a single line.
- `sdk.replay.createSession(...)` is not reliably followed by an immediately readable current session; when bootstrapping a first Replay send, wait for `onCurrentSessionChange(...)` before assuming the new session is selected.
- Replay entries may not have a backing request object, so do not assume a Replay entry always exposes a request id.
- For Replay-originated connection inference, prefer `entry.connection` and only use request `Host` header overrides when present; do not round-trip through backend request lookup just to recover host/TLS/port.
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
  - packaged nvertor Convert workflow at `packages/workflows/src/nvertor-convert`
  - backend API registration at `packages/backend/src/index.ts`
- Keep new work aligned with this split unless the user requests a broader refactor.
