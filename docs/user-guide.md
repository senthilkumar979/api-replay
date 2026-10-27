# User guide

ApiReplay is a local Electron app: an embedded Chromium pane on top, and a network inspector below. Traffic is recorded with Chrome DevTools Protocol. Nothing is uploaded.

## Window

| Control | What it does |
| --- | --- |
| Address bar + **Go** | Navigate the embedded browser (`http`, `https`, `localhost`) |
| **Recording** / **Paused** | Capture into the live list only while recording |
| **Clear** | Drop in-memory captures. Saved APIs and rules stay |
| **Mocks on / off** | Enable Fetch interception for XHR and Fetch |
| **Disable** | Emergency stop: continue paused requests and turn mocks off |
| **Hide** / **Inspector** | Collapse the inspector so the page fills the window |

Drag the split under the page to resize the inspector. Drag the split between the list and details. Collapse details with the panel button on the details header.

## Capture list

The list groups duplicate calls by identity:

`METHOD + origin + pathname + normalized query`

Query keys and values are sorted, so `?b=2&a=1` and `?a=1&b=2` are the same API. Different methods stay distinct.

**Type defaults to XHR.** `fetch()` shows up as **Fetch**. Switch the type filter to **Fetch** or **All types** if a call is missing. Other filters: method, status, saved/unsaved/mocked, search, sort.

Captures stay in memory until you click **Save this API**. Restarting the app drops unsaved traffic.

## Details

Select a row to inspect overview, headers, query, bodies, timing, and history. Body states are labeled (`available`, `empty`, `unavailable`, `too-large`, `unsupported`) instead of being truncated silently.

**Save this API** writes the request identity and last response to the local SQLite file. Optionally activate a mock rule at save time. Saving the same identity again asks whether to replace or keep a new copy.

## Mocking

After a save, open the **Mock rule** tab:

1. Keep mode **Mock response** unless you intentionally need **Modify and forward**.
2. Edit status, body, and headers, or apply a preset.
3. Enable the rule and turn **Mocks on**.
4. Repeat the same XHR/Fetch call in the page.

If a selected mock cannot be fulfilled, ApiReplay returns a visible **502** mock-failure response. It does not forward that request to the real backend.

**Modify and forward** is opt-in and asks for confirmation on non-local origins.

**Test match** checks the current capture against the rule. **Restore captured** puts the recorded body back. **Disable** on the toolbar is the panic switch.

## Privacy

Work stays on this machine. Authorization headers and cookies are redacted from ordinary logs. The database lives under the Electron user-data directory (`apireplay.sqlite`).
