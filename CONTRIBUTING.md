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