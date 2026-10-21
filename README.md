# DIA-FRONTEND · Dietograms

A local frontend demo for a nutrition-practice workspace. Built with semantic HTML, CSS, and JavaScript ES modules, with no third-party runtime dependencies.

## Run locally

Requires Node.js 20.11 or later.

```sh
npm run dev
```

Open http://localhost:5173.

Demo login: **demo@dia.app** / **DiaDemo123!**

First sign-in requires general profile, company details, and simulated bank verification before the dashboard opens. Use sample information. Full account numbers and routing codes are discarded when the banking step is submitted.

## Features

- Login validation, saved theme preference, required onboarding, and a restartable workspace tour.
- Dashboard, client-ID/name search, notifications, and responsive navigation.
- Editable client records, notes, diet plans, saved questionnaires, and progress check-ins.
- Per-client questionnaire drafts, autosave, refresh/resume, review, and optional client-record updates.
- Standard, Pro, and Plus model previews, simulated generation events, credit deductions, retries, cancellation, and refunds.
- Generation history and background status tracking.
- Report studio with editable meals, quantities, calories, logos, colours, typography, layout, and templates.
- Selection-based bold, italic, underline, strikethrough, lists, alignment, undo/redo, and clear formatting for document introduction and guidance.
- 38 font families, custom installed-font names, 8–72 px text, heading sizes, line/paragraph spacing, margins, A4/Letter/Legal, portrait/landscape, table spacing, and footer controls.
- Drafts, duplication, publication to the client record, and preserved published versions when editing.
- PDF through browser print, Word-compatible `.doc`, and JSON export.
- Progress timelines, weight charts, adherence and energy scores.
- Simulated subscription changes, independent credit top-ups, invoices, and billing CSV exports.

## Required diet-plan questionnaire

The creation flow has six stages:

1. **Personal details:** client name, gym name, age, gender, height, weight, and goal.
2. **Routine & lifestyle:** wake/sleep times, occupation, occupational schedule, lifestyle, and workout type/timing/duration.
3. **Medical history:** conditions and onset, medications, procedures, supplements, and openness to supplement suggestions.
4. **Food habits:** breakfast/lunch/dinner recall and timing, snacks and timing, allergies, and Veg/Non veg/Eggitarian preference. Foods liked and additional details are optional.
5. **Review & generate:** review the complete assessment, configure the plan, record client agreement, and acknowledge practitioner review.
6. **Generation:** follow each simulated event and open the resulting draft.

All 24 required questionnaire answers and the client-agreement record are validated before generation can use credits. Enter an explicit None or No gym when appropriate. Older clients are not assigned invented health answers or agreement. Selecting **Also save this questionnaire** stores the assessment in the client’s Questionnaire tab; otherwise the answers remain in the draft and generated plan context.

## Branding

The interface follows the Dietograms.com visual language observed on 21 October 2026: green headings, mustard actions, Manrope, DM Mono, and paper assessment motifs. The latest user-provided **#ECEAE3** swatch is used across light-theme page, header, navigation, panel, and form backgrounds. Dark mode remains available.

Fruit illustrations are CSS-only, have black silhouette outlines, and appear in content/loading states. The decorative vine-and-fruit page border has been removed. Preview the fruit collection at http://localhost:5173/public/fruit-preview.html.

## Demo boundaries

Authentication, verification, model responses, model capabilities, credits, prices, purchases, and invoices are illustrative. No clinical model, payment processor, bank, email service, or production database is connected. Data is saved in the current browser and is not shared across devices. Do not enter real sensitive client or financial information.

Generation produces a sample daily meal guide repeated across the selected duration. The full questionnaire is attached to the generation job and plan context for future backend integration, but clinical conditions, restrictions, cuisine, and preparation requirements are not interpreted by a clinical model. Review all sample outputs before use.

Agreement is recorded within the local demo; no questionnaire or agreement is submitted to the linked Dietograms website. Production consent, authentication, verification, credit enforcement, permissions, uploads, and clinical generation must be implemented on the backend.

PDF opens the browser print dialog; select Save as PDF. Word export is HTML-based `.doc`, not native `.docx`. Font names do not install or license unavailable fonts; browser fallbacks apply. Logo uploads accept PNG/JPEG up to 1 MB.

## Checks

```sh
npm run check
npm test
```

The tests cover mandatory answers, optional fields, agreement validation, allowed options, invalid measurements/times, legacy autofill, questionnaire snapshots, and client-record mapping. Browser checks covered the staged flow, refresh/resume, generation gating, saved client assessment, theme switching, search/autofill, and responsive layouts.

## Source structure

- `src/app.js` — routing, actions, form handling, autosave, generation simulation, and exports.
- `src/core/store.js` — sample records, browser storage, model and job contracts.
- `src/core/intake.js` — questionnaire schema, validation, completion, snapshots, and client mapping.
- `src/core/ui.js` — shared helpers, escaping, fruit markup, and downloads.
- `src/core/dropdowns.js` — themed searchable dropdowns and keyboard navigation.
- `src/core/rich-text.js` — rich-text sanitization.
- `src/modules/views.js` — workspace modules and document preview.
- `src/modules/intake-view.js` — assessment stages, review, and summary.
- `src/styles/` — workspace themes, responsive/print styles, brand styling, and CSS fruit artwork.
- `public/assets/` — supplied logo and locally hosted fonts.
- `tests/` — questionnaire validation tests.
- `server.mjs` — preview server bound to localhost.

## Asset credits

The supplied fruit CSS reference is adapted and namespaced in `src/styles/reference-fruits.css`. Its original credits are preserved: https://codepen.io/munkholm/pen/twuiD and https://justynabie.github.io/iFruity/.

Manrope and DM Mono fonts are distributed with their SIL Open Font License files in `public/assets/fonts/`. The Dietograms logo was supplied by the project owner.
