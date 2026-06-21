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
