# Demo walkthrough

Use the playground so you are not pointing a live site at mocks.

## Start

Terminal 1:

```bash
pnpm playground
```

Terminal 2:

```bash
pnpm dev
```

In ApiReplay, go to `http://127.0.0.1:4020`. Leave **Recording** on.

## 1. Record XHR

The type filter starts on **XHR**. Click **Load products** in the XHR section. The list should show `GET /api/products` with count 1. Click it again — count increases, same row.

Open **Response body**. You should see Widget and Gadget.

## 2. Save and mock

1. **Save this API**. Optionally check activate rule, or enable it later on **Mock rule**.
2. On **Mock rule**, set status `200` and body `{"ok":true,"source":"mock"}`. Save changes.
3. Turn **Mocks on**.
4. Click **Load products** again.

The page **Last response** should show the mock JSON. The list row is marked mocked. The real playground process is not required to change.

## 3. Fetch vs XHR

Click **Load products** in the Fetch section. If the list looks empty, set type to **Fetch** or **All types**. Fetch and XHR for the same URL are the same identity if method/path/query match; resource type on the group reflects the latest call.

## 4. Query identity

Click **Query order B,A** then **Query order A,B**. They should land on one `GET /api/search` group because query keys are normalized.

## 5. Side effect isolation

With mocks **off**, click **Side effect** (XHR). The count in the JSON increases.

Save that POST, mock it with `{"count":0,"source":"mock"}`, enable mocks, click again. The playground counter on the server should stop increasing; only the mock body returns. **Disable** on the toolbar restores live traffic.

## Fixture API

`pnpm fixture` is the slimmer test page on `http://127.0.0.1:4010`. Prefer `pnpm playground` for walkthroughs.
