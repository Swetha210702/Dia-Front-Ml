# Database preparation — awaiting connection approval

No Firebase project has been selected, accessed, created or deployed. No existing local records are migrated automatically. The current app starts signed out and empty; its read-only workspace view never writes client data.

## Record layout

`users/{uid}` stores user preferences and home workspace. `workspaces/{workspaceId}` stores practice identity and server-maintained onboarding status. All workspace collections are beneath that workspace document:

| Collection | Purpose / ownership |
| --- | --- |
| members | Server-created roles: owner, practitioner, viewer. Membership and workspace ownership are never self-granted. |
| clients | Client details, search key, active/paused/archived status, deletion metadata. |
| assessments | Immutable questionnaire versions and consent evidence: policy/terms version, actor and server timestamp. |
| plans | Draft/published metadata, assessment reference, generation tier snapshot, parent/root/version links. Large report bodies live in Storage with versioned object paths. |
| generations | Captured request ID, tier/cost, status, public phase events, sequence, timestamps, saved plan reference. Server-owned. |
| checkins | Client and optional plan references, measurements, date, notes. |
| subscriptions / invoices | Payment-provider-confirmed state; money uses integer minor units and an explicit currency. Server-owned. |
| creditLedger | Append-only ledger with idempotency key and balance after each charge/refund/allowance. Server-owned. |
| activity | Server-created audit records; changed field names, actor and request references. Avoid copying clinical answers into logs. |
| notifications | Server-created notifications; recipient may update only read state. |
| automations | Practitioner scheduling preferences; scheduler owns next run/execution. |
| files | Storage object references and metadata. Do not store base64 documents, logos or certificates in Firestore. |

`schema.json` describes version 1 document shapes. It is a design contract, not an active database validator. Browser boundary checks live in `src/core/validation.js`; full schema enforcement, cross-record checks and authorization must also run on the server in stage 3.

## Invariants for implementation

- Obtain workspace scope from verified membership. Never trust a workspace ID or role supplied by the browser alone.
- Assign record IDs on the server; check references belong to the same workspace/client.
- Use server timestamps, schemaVersion and revision counters; reject stale writes with a conflict response.
- Publish via a transaction. Published bodies and questionnaire snapshots are immutable; edits create a new draft revision.
- Soft-delete with actor/time. Restore within a transaction, checking references, ID conflicts and running jobs; retain financial/audit history.
- Debit credits and create a job atomically using an idempotency key. Settle cancellation/failure once. The client never edits balances or marks payments paid.
- Verify payment webhook signatures and deduplicate provider event IDs.
- Enforce the active subscription server-side and snapshot tier/cost when accepting a generation. Do not relabel historical plans after a subscription change.
- Generation progress comes from an authorized subscription to backend events. Accept monotonic sequence/phase updates and require a saved plan reference before completion.
- Use an actual scheduler for month-end runs, with timezone and monthly deduplication keys.
- Upload constraints: logo PNG/JPEG ≤1 MB; certification PNG/JPEG/PDF ≤2 MB; report PDF ≤10 MB. Validate decoded content, membership, path, type and size; Storage contentType alone is not proof of file contents.
- Keep clinical records out of browser localStorage and application logs. Define retention, export and deletion policies before using real client data.

## Security baseline and next approval

`firestore.rules` and `storage.rules` deny all access. They are intentionally closed baselines, not the final application rules. `firestore.indexes.json` prepares the intended tenant-scoped query patterns.

Stage 3 must implement and emulator-test membership/role isolation, field validation, immutable published records, backend-only billing/jobs/audit writes, scoped uploads and denied anonymous access before opening access. No rules/emulator deployment or security certification is claimed here.

References: [Firestore role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access), [query security](https://firebase.google.com/docs/firestore/security/rules-query), [Storage rule conditions](https://firebase.google.com/docs/storage/security). Server SDK access bypasses Firestore rules, so server authorization is required independently.
