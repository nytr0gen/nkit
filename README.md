# nkit

nytr0gen toolkit for caido.

## Features

- Copy URL from request panes, Replay, HTTP History, and Automate
- Copy URL from selected HTTP History rows through the right-click menu
- Paste a URL into Replay; it trims input, prefixes `https://` when missing, updates the target, and sends the request
- Replay `nvertor` templates such as `<@url>...</@>`, `<@urld>...</@>`, `<@urlall>...</@>`, `<@urlalld>...</@>`, `<@b64>...</@>`, `<@b64d>...</@>`, `<@html>...</@>`, `<@htmld>...</@>`, `<@repeat(3)>...</@>`, and generator tags like `<@uuid>` or `<@uuid/>`, plus `<@ts>` or `<@ts/>`
- Explicit tag closing also works, like `<@url>...</@url>`
- A Replay `Converted` request pane that shows the rendered request without altering the editor draft
- `Send Converted Request` in Replay plus `Copy Converted Request` from the Replay request context menu

## Shortcuts

- `Ctrl/Cmd+Shift+C`: Copy URL from Replay, HTTP History, and Automate request editors
- `Ctrl/Cmd+Shift+V`: Paste URL into Replay
- `Ctrl/Cmd+Enter`: Send Converted Request from Replay using the current tracked request draft
