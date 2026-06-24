# 🏥 CareSync

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=black)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel\&logoColor=white)](https://care-sync-iota.vercel.app/)

> **Accessible healthcare made simple.**
> A smart, modular web application for medicine tracking, symptom checking, and clinic discovery.

---

## 🌐 Live Demo

👉 **[https://care-sync-iota.vercel.app/](https://care-sync-iota.vercel.app/)**

---

## 📖 About

**CareSync** empowers individuals to take control of their health management. Built to be accessible and intuitive, it solves the problem of scattered healthcare information by centralizing medicine reminders, symptom analysis, and local medical resource discovery into one cohesive platform.

Whether you are managing a chronic condition or just need a quick check-up on symptoms, CareSync acts as your personal health companion.

---

## ✨ Key Features

### 💊 Medicine Tracker

* Add, edit, and manage daily prescriptions
* Set custom reminders so you never miss a dose

### 🔍 AI-Powered Symptom Checker

* Input symptoms to receive possible conditions
* Basic risk assessment and suggested treatments

### 🏥 Clinic Locator

* Find nearby hospitals and clinics using geolocation
* Interactive map integration using OpenStreetMap

### 📱 Responsive Design

* Optimized for mobile, tablet, and desktop
* Built using Material UI and Bootstrap

---

## � Looking for Something to Contribute?

Whether you're a first-time contributor or an experienced developer, there are many ways to contribute to CareSync.

### Start Here
- Check the open Issues for bugs, enhancements, and feature requests.
- Read the FUTURE_ROADMAP.md file to explore planned features.
- Review CONTRIBUTING.md for contribution guidelines.
- Look for issues labeled:
  - good first issue
  - enhancement
  - bug
  - documentation

### Have an Idea?
If you would like to work on a new feature that is not currently listed, open a discussion or create a feature request issue before starting development.

We welcome contributions of all sizes, including:
- Bug fixes
- UI/UX improvements
- Documentation updates
- Performance optimizations
- New features

---

## �🛠️ Tech Stack

### Frontend

* **React 18** – Component-based UI
* **Material UI (MUI)** – Modern, accessible UI components
* **Bootstrap** – Grid system and layout utilities

### APIs & Services

* **OpenStreetMap (Nominatim)** – Geocoding and location services
* **Vercel** – Deployment and hosting

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

* **Node.js** v16 or higher
* **npm** v8 or higher

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/vallabhatech/CareSync.git
cd CareSync
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy the example environment file and adjust the values as needed:

```bash
cp .env.example .env
```

CareSync is a [Create React App](https://create-react-app.dev/) project, so
all environment variables **must** be prefixed with `REACT_APP_` to be exposed
to the browser, are embedded at **build time** (you must restart `npm start`
after changing them), and are read via `process.env.REACT_APP_*`. See the
[Environment Variables](#environment-variables) reference below for what each
one does.

4. **Start the development server**

```bash
npm start
```

The app will open automatically at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Environment Variables

CareSync reads configuration from a `.env` file at the project root. Start by
copying the template:

```bash
cp .env.example .env
```

Because this is a Create React App project, every variable **must** begin with
`REACT_APP_`. Variables are inlined into the build at compile time, so after
editing `.env` you must stop and restart the dev server (`npm start`) for
changes to take effect. Never commit your real `.env` file — only
`.env.example` (with empty or placeholder values) belongs in version control.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_MAP_API_KEY` | No | _(empty)_ | API key for a maps provider (e.g. Google Maps), reserved for future paid map integrations. The current Clinic Locator uses the free OpenStreetMap/Nominatim API and does **not** require this key, so it can be left blank for local development. |
| `REACT_APP_API_BASE_URL` | No | `http://localhost:5000` | Base URL of the backend API, used as a prefix for backend requests if/when a backend is integrated. CareSync is currently a frontend-only app, so this is a forward-looking placeholder. |
| `REACT_APP_ENABLE_ANALYTICS` | No | `false` | Feature flag to toggle analytics. Set to `true` to enable analytics-related behavior; left `false` by default for local development and privacy. |

> **Note:** All three variables are currently **optional** — CareSync runs
> locally with an unmodified `.env` (or no `.env` at all). They exist to
> document the configuration surface and to support planned backend,
> paid-maps, and analytics integrations.

---


## ⚡ Quick Deploy

Deploy your own instance instantly using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🗺️ Roadmap

* [ ] User authentication (Login / Signup)
* [ ] Backend integration for persistent user data
* [ ] Push notifications for medicine reminders
* [ ] Telemedicine appointment booking
* [ ] Multi-language support

---

## 🤝 Contributing

Contributions are what make the open-source community grow and thrive. Any contribution you make is **greatly appreciated**.

### Steps to Contribute

1. Fork the project
2. Create your feature branch

```bash
git checkout -b feature/AmazingFeature
```

## Configured request/response limits

- **Server body limit:** configured via `server/config/limits.js` (default `5mb`). Override with `BODY_LIMIT` or `BODY_LIMIT_BYTES` environment variables.
- **Client axios limits:** configured via `src/utils/httpConfig.js` (`REACT_APP_MAX_CONTENT_LENGTH` and `REACT_APP_MAX_BODY_LENGTH`, defaults `5MB`).

Requests rejected due to oversized payloads are logged on the server with IP, URL, method and Content-Length.

## Security Considerations

This project includes a set of defensive controls and tests to mitigate common web application security issues. The following sections summarize requirements, protections implemented, and how to run the security test-suite.

1. Axios version requirements
- We require `axios` >= 1.18.0 in `package.json`. Keep `axios` up-to-date to receive security fixes. Monitor advisories and update promptly. Tests in `src/utils/api.test.js` assert configured limits are present.

2. Security risks addressed
- Oversized payload (DoS) attacks: server and client limits are configured and tested.
- Header injection (CRLF): server sanitizes response headers; the client and server validate header names/values and reject CRLF/control characters.
- Prototype pollution: request bodies are sanitized (server-side middleware strips `__proto__`, `constructor`, and `prototype`).
- Regular expression Denial of Service (ReDoS): complex regexes were replaced with ReDoS-resistant logic and length checks.
- Server-Side Request Forgery (SSRF): URL validation normalizes/inspects hostnames, rejects private/loopback and cloud metadata addresses.

3. SSRF protections
- All outbound URLs validated in `src/utils/sanitize.js` via `validateUrl()`:
  - Enforces allowed protocols (`http`, `https`).
  - Blocks cloud metadata hostnames (e.g. `169.254.169.254`).
  - Normalizes IPv4/IPv6 encodings to detect hex/decimal/octal encodings and mapped IPv6 forms.
  - Rejects loopback, private, link-local, APIPA and reserved ranges.

4. Header validation
- Header names validated against RFC-like token regex and limited to 256 characters in `src/utils/sanitize.js`.
- Header values are trimmed, disallow control characters (0x00-0x1F, 0x7F), CR/LF, and limited to 4096 characters.

5. Payload size limits
- Server body limit: configured in `server/config/limits.js` (default `5mb`). Express body-parser uses this limit and oversized payloads return `413 Payload Too Large` (or `400` in some environments). Logs include IP, URL, method, and Content-Length.
- Client axios limits: `src/utils/httpConfig.js` defines `DEFAULT_MAX_CONTENT_LENGTH` and `DEFAULT_MAX_BODY_LENGTH` (default `5MB`). The axios instance in `src/utils/api.js` applies `maxContentLength` and `maxBodyLength`.

6. Prototype pollution prevention
- Server middleware `server/utils/requestSanitize.js` strips dangerous object keys recursively before route handlers run.
- `sanitizeConfig()` in `src/utils/sanitize.js` also removes prototype keys from client-side config data where applicable.

7. Testing strategy
- Server tests (Jest + Supertest) are located under `server/tests/`.
- Frontend tests (Jest + react-testing-library) are located under `src/utils/`.
- To run server tests:
```powershell
cd server
npm install
npm test
```

Run frontend tests from repo root:

```bash
npm install
npm test
```

If you'd like, I can open a PR with these security changes and the test-suite, or wire these tests into CI (GitHub Actions) so they run automatically on each push.


3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push to the branch

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

## 👥 Team

* **Surishetty Harivallabha Sai** – [@vallabhatech](https://github.com/vallabhatech)
* **Hazari Thanusree** – [@HazariThanusree-2005](https://github.com/HazariThanusree-2005)

---

## 📄 License

Distributed under the **MIT License**.
See the `LICENSE` file for more information.

---

⭐ If you like this project, don’t forget to star the repo!
