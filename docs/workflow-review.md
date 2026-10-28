# Task 1 — workflow review and Plan Studio

Status: local changes ready for review. Not committed, pushed or deployed. Production cleanup, real databases and Firebase have not started; they require the user’s next approvals.

## Verification

- 50 Node regression tests pass (`npm test`).
- 9 document browser checks pass (`tests/browser-check.html`).
- 9 page-layout browser checks pass (`tests/page-layout-check.html`).
- Frontend JavaScript syntax checks pass (`npm run check`).
- Browser workflow testing used fictional records at `http://127.0.0.1:5173`, isolated from the existing `localhost` workspace’s storage.
- Desktop light and dark layouts inspected. Real application rendered in a 390 × 844 iframe: document width and scroll width were both 390px. Sidebar navigation and subscription cards checked at that width.
- No application console errors observed during the final session checks.

## Browser workflows exercised

| Area | Actions and outcomes |
| --- | --- |
| Access | Wrong password rejected; valid demo login; incomplete onboarding blocks dashboard; required profile fields; company setup; certification upload; review; tour next/back/skip; password-help modal; remembered login after refresh; sign-out persists after refresh. |
| Clients | Create fictional client, edit notes/name/weight/status, name/ID search, empty results, keyboard global search, analysis drill-down, clear filter. Latest details autofill a fresh assessment. |
| Questionnaire | Personal/routine/medical/food sections; required fields; explicit None answers; optional blanks; save-and-exit/resume; client-picker search; switch between clients without mixing drafts; live error clearing; review and client agreement gates. |
| Generation | Start; observe phases; assessment snapshot; cancel; one-time refund; simulated failure; retry with newly selected tier; complete; background continuation; return from dashboard; save to plan list. Standard, Pro and Plus generation paths exercised. |
| Subscription | Cancel a proposed switch; confirm an upgrade and downgrade; current-tier state; top up without changing tier; matching credit ledger and invoice entries. Existing plan tiers remain historical. |
| Editor | Direct document editing; uploaded logo replaces header image; added page; inserted bordered table; table width/border/cell padding; added rows and columns; saved draft; page-settings title; immediate navigation after edits; reload; published version; separate draft revision; questionnaire/version history. |
| Recovery | Cancel removal; remove/restore a check-in; remove/restore a plan with its document and version links; remove/restore a client with plans, questionnaire, progress, jobs and notifications together. |
| Progress | Create and edit linked check-in; weight and adherence update; remove/restore and verify weight. Automated tests also cover backdated records and reassignment between clients. |
| Billing | Invoice detail; invoice text download; billing CSV; tier and top-up invoices. |
| Notifications | Mark all as read; enable scheduling validation; selected client reminder; immediate month-end test; repeated run does not duplicate the monthly reminder or consume credits. |
| Analysis/settings | Reporting period; client-goal drill-down; saved practice identity; theme switching; activity/recovery panel. |
| Exports | JSON and Word-compatible files downloaded and inspected: captured Plus tier, three document pages, uploaded logo, inserted table and removal of editor controls. PDF print action invoked; see limitation below. |

## Fixes and additions

1. Added recoverable trash for clients, plans and check-ins, including linked-client recovery and reserved client IDs. A client with a running generation cannot be removed.
2. Added a local workspace activity history for client, plan, check-in, subscription, credit, generation, automation and settings changes. This is not a verified server audit log.
3. Fixed selected-client details remaining visible after that client was excluded by search/filter.
4. Replaced the hard-coded dashboard progress chart with recorded check-in data.
5. Fixed fresh assessments retaining stale client details and previous revision links. Revisions keep their historical questionnaire but no longer overwrite the current client record by default.
6. Clear corrected validation errors while typing. Archived clients are excluded from new assessment selection and blocked from generation.
7. Fixed delayed report pagination capturing an unrelated or empty document after navigation. The callback is cancelled on rendering and checks the selected plan before saving.
8. Added a page-settings plan title that synchronises saved pages and exports, including recovery of a removed title heading.
9. Fixed zero table borders, padding and spacing reverting to defaults when reopening table properties. Body cell colour no longer defaults to the header’s colour.
10. Added idempotent cancellation/failure refunds and protection against reapplying the current subscription allowance.
11. Keep current client weight consistent when check-ins are edited, reassigned, removed or restored.
12. Refresh generation immediately when its assessment modal closes, including a request that finished while the modal was open.
13. Ensure rounded preview meal calories total the selected daily target exactly.
14. Reset scroll position after sign-in and onboarding step advancement.

## Plan Studio

- Progress ring with the current phase and a small, centred three-fruit loader during generation only.
- Client brief, preferences, calorie target, duration and allergy/exclusion summary beside the work.
- Expandable phases; manually opened/closed details and keyboard focus survive progress updates.
- A meal preview appears after the structure phase, then becomes the saved draft summary.
- Captured subscription tier and credit cost stay visible.
- Assessment snapshot, saved activity log, background continuation and dashboard return path.
- Clear completion, cancellation and failure states with review or retry actions.
- Responsive light/dark styling and reduced-motion support.

## Verification limits / next stages

- Model processing, purchases, login and stored workspace records remain the existing browser demo. This review does not claim real model, payment, authentication or database integration.
- Preview progress is simulated and labelled accordingly. Real status updates must come from backend events once that service is connected.
- PDF export invokes the browser/system print flow. Native final Save as PDF could not be inspected through the available automation. Physical page dimensions, overflow, fixed footers and export markup passed browser checks, but a final saved PDF requires a manual platform check.
- Word export remains HTML-based `.doc`, not native DOCX; its downloaded content was checked, not rendered in Microsoft Word.
- Browser-local storage has its existing capacity and multi-tab limitations. Database durability, authorization, isolation and server audit rules belong to the approved production/Firebase stages.
- Existing reset-demo control was not confirmed, to retain the test records for review. It still requests confirmation. Unit and browser checks do not guarantee the absence of every possible bug or cover every browser/OS combination.
