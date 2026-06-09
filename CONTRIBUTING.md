# Contributing to CareSync

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution.

## Table of Contents

- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)

## I Have a Question

If you want to ask a question, we assume that you have read the available documentation. Use the "Issues" tab on GitHub to ask questions!

## I Want To Contribute

### Reporting Bugs

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/vallabhatech/CareSync/issues).
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a **title and clear description**, as many relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- Open a new issue with the tag **enhancement**.
- Explain why this enhancement would be useful to most CareSync users.

## Finding Something to Work On

Not sure where to start?

### Explore Existing Issues
Check the Issues tab for:
- Bugs
- Enhancements
- Documentation improvements
- Feature requests

### Review the Roadmap
The FUTURE_ROADMAP.md document contains planned features and future improvements for CareSync. Contributors are encouraged to review the roadmap and discuss implementation ideas before starting work.

### Recommended Labels
Look for issues labeled:
- good first issue
- enhancement
- bug
- documentation

### Before You Start
If an issue is not already assigned, leave a comment expressing your interest before beginning work. This helps avoid duplicate efforts and improves collaboration.

### Your First Code Contribution

1. **Fork the repository** and create your branch from `main`.
2. Run `npm install` to install dependencies.
3. If you've added code that should be tested, add tests.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Commit your changes using a descriptive commit message.
7. Push your branch to GitHub.
8. Submit a Pull Request to the `main` branch.

## Contributing to Specific Features

Some CareSync features have their own data and conventions. If you're extending
one of these, here's where to look and how to do it safely.

### Symptom Checker

The symptom checker lives in `src/pages/SymptomChecker.jsx` and is driven by two
data structures at the top of the file:

- **`COMMON_SYMPTOMS`** — the list of selectable symptom names. The input only
  accepts values from this list, so any symptom you want users to be able to
  select must be added here first. Keep the casing consistent with existing
  entries (e.g. `"Sore throat"`).
- **`RISK_RULES`** — the rules that map symptoms to possible conditions. Each
  rule has `symptoms`, `condition`, `probability`, `causes`, `solutions`, and a
  `risk` tier (`"low"`, `"medium"`, or `"high"`).

**To add a new condition:** append a rule to `RISK_RULES`. For a rule to match
fully, the strings in its `symptoms` array should exist in `COMMON_SYMPTOMS`
(users can only select symptoms from that list, so any not present there will
only ever match partially). See the JSDoc above `RISK_RULES` for the full rule
shape and how the matching/scoring works. This is medical-adjacent content —
please keep conditions and suggested actions responsible and general (the app is
not a substitute for professional medical advice).

### Medicine Tracker

The medicine tracker lives in `src/pages/MedicineTracker.jsx` and stores data in
the browser's `localStorage` under the key `caresync_medicines`. Each entry has
the shape `{ id, name, time, date }` (dates are `YYYY-MM-DD` strings).

**To extend it:** keep reads/writes going through `localStorage` with that same
key and shape so existing users' saved medicines keep working. The Dashboard
also reads `caresync_medicines` to count today's medicines, so any change to the
entry shape should be reflected there too.

### Symptom Checker

The symptom checker lives in `src/pages/SymptomChecker.jsx` and has two main
components:

- **`COMMON_SYMPTOMS`** — the list of selectable symptom names. The input only
  accepts values from this list, so any symptom you want users to be able to
  select must be added here first. Keep the casing consistent with existing
  entries (e.g. `"Sore throat"`).
- **`RISK_RULES`** — the rules that map symptoms to possible conditions. Each
  rule has `symptoms`, `condition`, `probability`, `causes`, `solutions`, and a
  `risk` tier (`"low"`, `"medium"`, or `"high"`).

**Assessment History:** Each completed symptom check is persisted to the browser's
`localStorage` under the key `caresync_symptom_history`. Each entry has the shape
`{ _id, checkedAt, symptoms, results }` where `results[0]` contains `condition`,
`probability`, and `risk`. History is capped at 20 most recent entries. If the
user is authenticated, checks are also synced to the backend via `/api/symptom-checks`.

**To add a new condition:** append a rule to `RISK_RULES`. For a rule to match
fully, the strings in its `symptoms` array should exist in `COMMON_SYMPTOMS`
(users can only select symptoms from that list, so any not present there will
only ever match partially). See the JSDoc above `RISK_RULES` for the full rule
shape and how the matching/scoring works. This is medical-adjacent content —
please keep conditions and suggested actions responsible and general (the app is
not a substitute for professional medical advice).

**To extend history storage:** keep reads/writes going through `localStorage`
using `loadHistoryFromLocalStorage()` and `saveHistoryToLocalStorage()`, and
respect the 20-entry cap (`MAX_HISTORY_ENTRIES`) so storage remains bounded. The
`createHistoryEntry()` helper creates properly-shaped entry objects.

### Internationalization (i18n) / Translations

CareSync uses [react-i18next](https://react.i18next.com/) for multi-language
support. The configuration lives in `src/i18n.js` and translation strings are
stored as JSON resource bundles in `src/i18n/locales/` (e.g. `en.json`,
`hi.json`). Strings are grouped into namespaces by feature (`common`, `nav`,
`dashboard`, `medicine`, `symptom`, `clinics`, `login`, `profile`, `settings`,
`footer`).

In components, strings are read via the `useTranslation` hook and referenced as
`t('namespace:key')`, for example `t('nav:dashboard')`. The user's chosen
language is detected and persisted to `localStorage` under the key
`caresync_language`, so the app reloads in the last selected language.

**To add a new language:**

1. Copy `src/i18n/locales/en.json` to a new file named with the language code,
   e.g. `es.json` for Spanish or `fr.json` for French.
2. Translate every **value** in the new file. Keep all **keys** exactly as they
   are — only the right-hand-side strings change. Preserve interpolation
   placeholders like `{{count}}` and `{{year}}` verbatim.
3. Register the language in `src/i18n.js`: import the new JSON file, add it to
   the `resources` object, and add an entry to `SUPPORTED_LANGUAGES`
   (`{ code: 'es', label: 'Español', dir: 'ltr' }`). For right-to-left
   languages (Arabic, Hebrew) set `dir: 'rtl'` — the document direction hook
   will pick it up automatically (RTL-specific CSS is a separate task).
4. That's it — the language selector in **Settings** maps over
   `SUPPORTED_LANGUAGES`, so your new language appears automatically.

**When adding new UI strings:** add the key to **every** locale file (at minimum
`en.json`), never hardcode user-facing text in JSX. The i18n test suite
(`src/i18n/i18n.test.js`) verifies that all locale files share the same key
structure, so a missing translation will fail CI.

### Documentation Style

When adding or changing components, please document them with JSDoc following
the existing style in `src/components/` and `src/pages/` — a short description of
what the component does, its props (if any), notable internal state or side
effects, and an `@example`. Consistent docs keep the codebase approachable for
new contributors.

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less

### JavaScript Styleguide

- We follow standard React best practices.
- Prefer Functional Components with Hooks.
- Use `const` and `let`, avoid `var`.