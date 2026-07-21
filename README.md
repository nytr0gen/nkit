# nkit

nytr0gen toolkit for caido.

## Features

- Copy URL from request panes, Replay, HTTP History, and Automate
- Copy URL from selected HTTP History rows through the right-click menu
- Paste a URL into Replay; it trims input, prefixes `https://` when missing, updates the target, and sends the request
- Replay `nvertor` templates such as `<@url>...</@>`, `<@urld>...</@>`, `<@urlall>...</@>`, `<@urlalld>...</@>`, `<@b64>...</@>`, `<@b64d>...</@>`, `<@html>...</@>`, `<@htmld>...</@>`, `<@repeat(3)>...</@>` (also `<@loop(3)>...</@>`), and generator tags like `<@uuid>` or `<@uuid/>`, plus `<@ts>` or `<@ts/>`
- Explicit tag closing also works, like `<@url>...</@url>`
- A Replay `Converted` request pane that shows the rendered request without altering the editor draft
- Native Replay sending through the packaged `nvertor Convert` workflow, plus `Copy Converted Request` and `Copy Converted URL` from the Replay request context menu
- A Match & Replace `Duplicate Rule` button that clones the current rule and appends the next trailing number to the name
- Cycle the HTTP History `Request alteration` dropdown with `Ctrl/Cmd+Shift+E`, including when only the row list is focused. DOM-Hacky implementation

## Shortcuts

- `Ctrl/Cmd+Shift+C`: Copy URL from Replay, HTTP History, and Automate request editors
- `Ctrl/Cmd+Shift+V`: Paste URL into Replay
- `Ctrl/Cmd+Shift+E`: Cycle the HTTP History `Request alteration` mode and return focus to the request pane

## Enable converted Replay sending

The plugin installs the `nvertor Convert` workflow, but you need to connect it to Replay with one Match and Replace rule:

1. Create a Match and Replace rule.
2. Set the section to `Request Raw`.
3. Set the matcher to `Full`.
4. Set the replacer to `Workflow` and select `nvertor Convert`.
5. Set the source to `Replay` and enable the rule.

Use Replay's normal send action after that. The tagged template stays in the editor, while the workflow converts the complete raw request immediately before it is sent. If conversion fails, the workflow returns the original request instead of an empty replacement.
