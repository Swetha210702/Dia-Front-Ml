# Dietograms frontend

Nutrition practice workspace: clients, assessments, diet-plan generation, report editing, progress, subscription/billing views, notifications, analysis and settings.

## Current status

Firebase Authentication is wired locally to `dia-frontend`: email/password, password reset, session restoration, remember-me persistence and sign-out. Sign-in loads a private Firestore workspace and resumes profile setup once the tested access rules are activated. The repository and rules are implemented locally; live rule publication is still pending. storage, generation, payments, scheduling and uploads are not connected. The initial state is empty, and read-only UI review remains available. These changes are not deployed. Certification can remain pending upload while onboarding completes; secure file uploads are a separate connection. No credential verification is implied.

Task 1’s workflow corrections and Plan Studio UI are retained. Task 2 removes seeded data and simulated behavior and prepares service/database boundaries. This repository is not yet a fully connected production application.

## Run and validate

Requires Node.js 22.12 or newer. Install the locked Firebase/Vite dependencies before starting.

```sh
npm ci
npm run dev
npm run check
npm test
npm run test:rules
npm run build
```

The local server listens on `http://localhost:5173`. `dist/` contains only application files and assets. Serve/deploy that directory for a production artifact; do not publish repository-root test or database preparation files as the application bundle. GitHub Pages builds the app with `.github/workflows/deploy.yml` and publishes only `dist/`. Public Firebase configuration is bundled; no privileged backend credentials are needed by the Pages workflow.

`npm run test:rules` requires Java 21 or newer and downloads the official Firestore emulator on first use. It targets an isolated local project, never production.

Browser checks are available locally at `/tests/browser-check.html` and `/tests/page-layout-check.html`.

## Code organization

- `src/core`: workspace state, intake/record validation, document editing, generation events and domain transformations.
- `src/modules`: UI views, including Plan Studio and activity/recovery.
- `src/services`: explicit auth, repository, generation, billing and file service contracts. Unconfigured services reject operations.
- `database`: proposed collection paths, document schemas, indexes and closed access baselines.
- `scripts`: syntax checking and bundled static artifact assembly.
- `tests`: domain and browser regression checks. Test-only fixtures stay outside the release artifact.

## Connection stage

Public web configuration is in `src/services/firebase-config.js`. The repository uses one private workspace per authenticated UID; server-side rules prevent cross-account reads/writes and protect billing/generation authority. Next, publish the emulator-tested Firestore rules, verify live onboarding and client saves, and connect file storage and server-controlled operations. Never place service-account keys, model/provider secrets or payment signing secrets in browser code. Public Firebase web configuration is distinct from privileged server credentials.

Application code stores only appearance preference in browser localStorage. Firebase Auth manages its own session tokens: tab-session persistence by default and local persistence when Remember me is selected. Passwords and clinical records are not stored by the app. Old browser workspaces are left untouched and ignored; any data migration requires explicit mapping, ownership review and consent.

See [production preparation](docs/production-preparation.md), [database design](database/README.md) and the historical [task 1 workflow review](docs/workflow-review.md).

The full follow-up audit of button permissions and rules is not finished. Diet generation has no model backend connected yet; enabling Firestore writes does not run a model.
