# nkit

nytr0gen toolkit for caido.

## Features

- Copy URL from request panes, Replay, HTTP History, and Automate
- Copy URL from selected HTTP History rows through the right-click menu
- Paste a URL into Replay; it trims input, prefixes `https://` when missing, updates the target, and sends the request
- Replay `nvertor` templates such as `<@url>...</@url>`, `<@urld>...</@urld>`, `<@urlall>...</@urlall>`, `<@urlalld>...</@urlalld>`, `<@b64>...</@b64>`, `<@b64d>...</@b64d>`, `<@html>...</@html>`, `<@htmld>...</@htmld>`, `<@uuid/>`, and `<@ts/>`
- A Replay `Converted` request pane that shows the rendered request without altering the editor draft
- `Send Converted Request` in Replay plus `Copy Converted Request` from the Replay request context menu

## Shortcuts

- `Ctrl/Cmd+Shift+C`: Copy URL from Replay, HTTP History, and Automate request editors
- `Ctrl/Cmd+Shift+V`: Paste URL into Replay
- `Ctrl/Cmd+Enter`: Send Converted Request from the Replay editor
