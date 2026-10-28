# Firebase connection progress

Project: `dia-frontend`. Web app configuration is public and committed with the application. No service-account credentials or Analytics initialization are included.

## Connected locally

- Official modular Firebase Authentication SDK, bundled through Vite for local development and GitHub Pages deployment.
- Email/password sign-in and Auth session observer; authenticated identity is distinct from authorized workspace membership.
- Session persistence by default; Remember me opts into local persistence before sign-in.
- Sign-out and account changes erase all in-memory workspace data, editor selections, overlays and transient form state.
- Password reset uses a uniform response for unknown accounts; raw errors and tokens are not displayed.
- Actual sign-in success needs to be verified by the owner using their password in the local page. Do not share that password in chat.

## Pending

The initial owner UID supplied is `kJ5uDZGp4ghMVWNUCWULNgYbMJ82`. It is recorded here for setup, not used as a browser-side access-control check. After rule activation, the signed-in owner creates their own root document through a constrained transaction; users cannot create or modify another account’s workspace.

Firestore was created manually in production mode. The local repository adapter and private-owner security rules are now implemented and tested, but the rules have not been published to the real project. Database ID is expected to be `(default)`; confirm the chosen region in Console before selecting backend function placement. The private workspace path is `workspaces/{auth.uid}`; the root owner is checked server-side and cannot be changed by the client. This first connection supports one practitioner per private workspace. Shared-team access remains closed. Each mutable record has independent revision metadata and a recoverable active/deleted state. Server entitlements, credits, invoices and generation results are read-only. A signed-in identity cannot unlock clinical forms until the actual database accepts these access rules.

File storage, diet-plan generation, subscription/credit settlement, payments and scheduling need their own verified connections. At the owner’s request, certification upload is optional during onboarding. Experience fields remain required, and the saved status is pending-upload until a document is uploaded. This does not imply credential verification. Firebase billing remains unchanged. Firebase sign-in does not activate those services.

## Validation

67 Node tests and 11 Firestore emulator integration/security tests pass, including adapter call ordering, persistence failures, token filtering, auth observation, reset error handling, account isolation and closed repository access. Production build bundles the SDK and uses relative asset paths for GitHub Pages. Runtime dependency audit reports zero vulnerabilities. Firebase CLI development dependencies currently report five moderate advisories; they are not bundled in the application. The production build currently reports a large lazy Firestore SDK chunk warning (about 580 KB minified).

A browser check uses a deliberately nonexistent account to verify the real Firebase error path. It never creates users or writes clinical records. Owner sign-in, actual reset-email delivery and remembered-session restoration remain manual checks.

Nothing has been committed, pushed or deployed during this connection step.

## Next manual activation step

Review `database/firestore.rules`, then publish its exact contents in Firebase Console → Firestore → Rules for `dia-frontend`. Keep Storage rules closed. Do not select test mode. After publishing, use Retry workspace connection in the app. No CLI login or production rule deployment has been performed here.

The app waits for acknowledged cloud saves before reporting that a client/profile/check-in was saved. Unsaved edits show an error with an explicit retry and a page-leave warning. Editing a record changed in another tab fails with a conflict rather than overwriting it. Record serialization is canonical so reloading does not rewrite unchanged records.

Browser checks confirmed the reported Add client action was blocked by the missing workspace connection; no test client was written to production. Practice Pulse now has consistent padding and a client-aware empty state. Preview mode has a prominent read-only explanation and a route back to connection setup.
