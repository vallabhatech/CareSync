# CareSync Backend API Server

This is the backend API server for CareSync, built using Node.js, Express, and MongoDB. It provides persistent data storage and secure endpoints for user sessions, medicine trackers, symptom histories, and bookmarked clinics.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16.x or higher)
- **MongoDB** (running locally or a hosted URI like Atlas)

### Setup Instructions

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy the example template to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in the values:
     - `PORT`: Port the server runs on (defaults to `5000`).
     - `MONGODB_URI`: Connection string for MongoDB (defaults to `mongodb://127.0.0.1:27017/caresync`).
     - `JWT_SECRET`: Secret key used for signing JWT tokens (**Required**).

4. **Start the server:**
   - **Development (with hot reloading):**
     ```bash
     npm run dev
     ```
   - **Production:**
     ```bash
     npm start
     ```

The API will be available at:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔒 Security Practices

1. **CORS Restrictions**: Requests are only accepted from whitelisted origins (`http://localhost:3000` for local frontend development, and `https://care-sync-iota.vercel.app` for the production application).
2. **NoSQL Injection Prevention**: All incoming parameters (email, passwords, place IDs, query parameters) are strictly cast to primitive string values and validated using schema checkers/regex to prevent payload pollution.
3. **Environment Isolation**: Default fallback keys for JWT signers have been removed. The server throws an explicit error and fails to boot if `JWT_SECRET` is undefined.

---

## 🛡️ Security Event Logging

All authentication-related security events are logged with structured metadata, persisted to MongoDB, surfaced in real time on the console, and exposed to admins through dedicated endpoints. Suspicious activity (e.g. brute-force login attempts) raises a real-time `CRITICAL` alert.

### Logged events

| Event Type | Severity | Raised when |
|---|---|---|
| `AUTH_REGISTER_SUCCESS` | info | A new account is created |
| `AUTH_REGISTER_FAILURE` | warning | Registration is rejected (missing fields, invalid email, duplicate email, or server error) |
| `AUTH_LOGIN_SUCCESS` | info | A user logs in successfully |
| `AUTH_LOGIN_FAILURE` | warning | Login fails (missing fields, invalid email, unknown account, or wrong password) |
| `AUTH_TOKEN_REJECTED` | warning | A request is denied due to a missing, invalid, or expired token, or a token for a deleted user |
| `AUTH_PROFILE_UPDATED` | info | A user updates their profile (records which fields changed) |
| `AUTH_PROFILE_UPDATE_FAILURE` | warning | A profile update is rejected |
| `ADMIN_ACCESS_DENIED` | warning | A non-admin attempts to reach an admin-only endpoint |
| `SUSPICIOUS_LOGIN_PATTERN` | critical | An IP exceeds the failed-login threshold within the window (possible brute-force) |

Each record stores: `eventType`, `severity`, `user` (when known), `email`, `ip`, `userAgent`, `method`, `path`, `statusCode`, `message`, `metadata`, and `createdAt`. Passwords are **never** logged.

### Real-time visibility & alerting

- Every event is printed to the server console (and therefore appears in the hosting platform's logs) via a leveled logger.
- Repeated failed logins from the same IP trigger a single `CRITICAL` `SUSPICIOUS_LOGIN_PATTERN` alert per window (de-duplicated), making brute-force attempts immediately visible.
- Optional file logging can be enabled with `SECURITY_LOG_TO_FILE=true` (keep it `false` on serverless/read-only hosts such as Vercel).

### Admin endpoints (`/api/security`)

Both routes require an authenticated user whose `role` is `admin` (`Authorization: Bearer <token>`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/security/logs` | Paginated, filterable event log. Query params: `page`, `limit` (max 100), `eventType`, `severity`, `ip`, `email`, `from`, `to`. |
| `GET` | `/api/security/stats` | Aggregated overview for a window (`hours`, default 24): counts by event type and severity, top offending login IPs, and recent critical events. |

### Configuration

These optional variables (see `.env.example`) tune the subsystem; all have sensible defaults:

- `SECURITY_FAILED_LOGIN_THRESHOLD` (default `5`)
- `SECURITY_FAILED_LOGIN_WINDOW_MIN` (default `15`)
- `SECURITY_LOG_TO_FILE` (default `false`)
- `SECURITY_LOG_DIR` (default `server/logs`)

---

## 📖 API Documentation

All request payloads should use `Content-Type: application/json`. Private routes require the `Authorization: Bearer <token>` header.

### 1. Authentication Router (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account. Returns user info & JWT token. |
| `POST` | `/api/auth/login` | Public | Authenticate a user with email and password. Returns user info & JWT. |
| `GET` | `/api/auth/me` | Private | Retrieve details of the currently authenticated user. |
| `PUT` | `/api/auth/profile` | Private | Update user details (name, email, phone, age, bloodGroup, allergies, avatar). |

### 2. Medicine Reminder Router (`/api/medicines`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/medicines` | Private | Fetch all scheduled medicine reminders for the user. |
| `POST` | `/api/medicines` | Private | Create a new medicine reminder (requires `name`, `time`, and `date`). |
| `DELETE` | `/api/medicines/:id` | Private | Delete a medicine reminder by its database ID. |

### 3. Symptom History Router (`/api/symptom-checks`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/symptom-checks` | Private | Retrieve the history of all symptom assessments done by the user. |
| `POST` | `/api/symptom-checks` | Private | Save a new symptom checker assessment session. |

### 4. Clinic Discovery Router (`/api/clinics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/clinics/favorites` | Private | Get the user's bookmarked favorite clinics. |
| `POST` | `/api/clinics/favorites` | Private | Bookmark a clinic (requires `name`, `address`, `lat`, `lon`, `place_id`). |
| `DELETE` | `/api/clinics/favorites/:id` | Private | Remove a clinic from favorites by its `place_id` or database ID. |
| `GET` | `/api/clinics/searches` | Private | Fetch recent clinic search queries logged by the user. |
| `POST` | `/api/clinics/searches` | Private | Log a clinic search query (requires `query`, `searchType`, `lat`, `lon`). |
