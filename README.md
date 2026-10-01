# nkit

nytr0gen's utility toolkit for Caido.

## Features

### Request utilities

- Copy URLs from request editors in Replay, HTTP History, Automate, Findings, Sitemap, and Search.
- Copy the URL from exactly one selected request row through its right-click menu.
- Paste a URL into Replay to create and send a fresh Chrome-style `GET` request. Whitespace is trimmed and a missing protocol defaults to `https://`.
- Normalize a Replay request to CRLF, ensure an empty request ends with one header terminator, and rewrite the first `HTTP/2` request line to `HTTP/1.1`.
- Cycle the HTTP History `Request alteration` dropdown and return focus to the request editor.

### nvertor Workflow

- Write transform tags directly in a Replay request while keeping the tagged template unchanged in the editor.
- Preview the rendered request in Replay's `Converted` request pane.
- Send rendered requests through the packaged `nvertor Convert` Match and Replace workflow.
- Copy the converted request or converted URL from the Replay request context menu.
- Return the original request when parsing or conversion fails, rather than sending an empty replacement.

### Match and Replace

- Duplicate the current rule with the `Duplicate Rule` button. Copies stay in the same collection and use the next available trailing number, such as `Rule 2`.

## Shortcuts

- `Ctrl/Cmd+Shift+C`: Copy URL from Replay, HTTP History, Automate, Findings, Sitemap, and Search request editors
- `Ctrl/Cmd+Shift+V`: Paste URL into Replay
- `Ctrl/Cmd+Shift+E`: Cycle the HTTP History `Request alteration` mode and return focus to the request pane

## nvertor tags

| Tag | Result |
| --- | --- |
| `<@url>text</@>` | URL-encode text |
| `<@urld>text</@>` | URL-decode text |
| `<@urlall>text</@>` | Percent-encode every UTF-8 byte |
| `<@b64>text</@>` | Base64-encode UTF-8 text |
| `<@b64d>text</@>` | Base64-decode UTF-8 text |
| `<@html>text</@>` | Encode HTML entities |
| `<@htmld>text</@>` | Decode HTML entities |
| `<@repeat(3)>text</@>` | Repeat text; `<@loop(3)>` is an alias |
| `<@>text</@>` | Pass text through unchanged |
| `<@uuid>` or `<@uuid/>` | Generate a UUID |
| `<@ts>` or `<@ts/>` | Generate a Unix timestamp |

Transforms can be nested. `</@>` closes the current transform, while a named closing tag such as `</@url>` must match the current transform. A transform without a closing tag applies through the end of the request, including across line breaks. Nested transforms left open at the end close from innermost to outermost.

`repeat` and `loop` accept non-negative integers. Values above `100000` are capped.

## Enable converted Replay sending

The plugin installs the `nvertor Convert` workflow, but you need to connect it to Replay with one Match and Replace rule:

1. Create a Match and Replace rule.
2. Set the section to `Request Raw`.
3. Set the matcher to `Full`.
4. Set the replacer to `Workflow` and select `nvertor Convert`.
5. Set the source to `Replay` and enable the rule.

Use Replay's normal send action after that. The tagged template stays in the editor, while the workflow converts the complete raw request immediately before it is sent. If conversion fails, the workflow returns the original request instead of an empty replacement.
