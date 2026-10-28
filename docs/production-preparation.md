# Task 2 — production preparation

This is a preparation stage, not a live production release. Firebase connection and real authentication/data persistence require the next approval.

## Completed

- Removed built-in credentials, seeded clinical/business records, generated meal library, timer-driven progress, simulated checkouts, fabricated invoices/credits and browser-only scheduler execution.
- Removed demo/sample/simulation wording from runtime source and product metadata.
- New empty workspace state has no account, tier, clients, plans or billing records. Legacy browser data is ignored and left untouched, never automatically imported into a real account.
- Only theme preference persists in localStorage. Authentication flags and clinical data are not restored from browser storage.
- Read-only workspace browsing supports review before services are connected. Writes and uploads fail closed; no fake successful login, save, payment or generation is presented.
- Added explicit service contracts for authentication, repository, generation, billing and files, with safe user-facing errors and adapter completeness checks.
- Retained task 1’s editor, history, recovery and Plan Studio UI; adapted empty states and disconnected service states.
- Added validation boundaries, workspace-scoped record/path helpers, database shapes and indexes, closed security baselines and implementation invariants.
- Generation event processing rejects foreign, duplicate, stale, invalid and terminal-overwriting events, and never adjusts credits in the browser.
- Added `npm run build`: stages only the application and its assets into `dist/`, excluding tests, design docs, rules, local records and credentials.

## Stage 3 work — not yet performed

Implement real service adapters and wire every write handler to acknowledged repository operations rather than local state transformations. Hydrate workspace state after Firebase authentication/membership resolution; expose write controls only after services are ready. Replace file data-URL preparation with scoped Storage uploads/references. Implement server generation orchestration, event subscriptions, transactional credits, publish/version checks, scheduler execution, provider checkout/webhooks and server audit records. Configure live subscription prices/allowances; no placeholder prices are shown.

See `database/README.md` for schema, paths and required server invariants. Firestore/Storage rules currently deny all; membership rules need emulator tests before deployment.

## Review and verification

Use `npm run dev`, open the local page, and choose “View workspace layout” for the empty read-only interface. The login form returns an explicit connection error until services are supplied. Existing browser records are not erased.

Run `npm test`, `npm run check`, `npm run build`, `/tests/browser-check.html` and `/tests/page-layout-check.html`. Firebase emulators, backend integration, clinical generation, payments and live database writes are not tested or claimed in this stage. The prior workflow review documents the task 1 baseline, whose simulated actions are now removed.

Nothing is pushed or deployed until reviewed.

Latest verification: 56 Node tests, 9 document browser checks and 9 pagination browser checks passed. Syntax checks and release build passed. The release artifact resolves all 50 relative module imports and excludes tests, database files, docs and repository metadata. Browser checks covered all empty modules, unavailable sign-in, rejected client creation and clean application console output.
