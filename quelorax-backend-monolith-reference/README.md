# Quelorax Backend API

A full Spring Boot REST API backend for the **Quelorax Queue Management System** frontend
(`quelorax-app`). It replaces the frontend's `localStorage`-based mock store
(`src/store/store.js`) with a real database + JWT-secured REST API, covering the same data
model: organization, users (admin/receptionist/staff/visitor), departments, queue tokens,
documents, notifications, OTP-based auth, and settings.

Built with: **Java 17, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, MySQL 8**.

---

## 1. Prerequisites

- **JDK 17+** installed (`java -version` to check)
- **MySQL 8** running locally — easiest way is Docker:
  ```bash
  cd quelorax-backend
  docker compose up -d
  ```
  This starts a MySQL container on `localhost:3306` with a `quelorax_db` database, root
  password `root` (matches the defaults in `application.properties`). No Docker? Install
  MySQL directly and either create a `quelorax_db` database yourself or leave it to
  auto-create (see step 8), then set `DB_USERNAME`/`DB_PASSWORD` env vars to match your
  install.
- **Eclipse IDE for Enterprise Java and Web Developers** (comes with Maven/m2e support built in)
  - If you have plain Eclipse, install "Maven Integration for Eclipse (m2e)" from
    `Help > Eclipse Marketplace`
- **Postman** (desktop app or web) to test the API

---

## 2. Import the project into Eclipse

1. Unzip the provided `quelorax-backend` folder anywhere on your machine.
2. Open Eclipse.
3. `File > Import...`
4. Choose **Maven > Existing Maven Projects** → Next.
5. Click **Browse**, select the `quelorax-backend` folder (the one containing `pom.xml`).
6. Eclipse will detect `pom.xml` — leave it checked → **Finish**.
7. Wait for Eclipse to download all Maven dependencies (bottom-right progress bar). This needs
   an internet connection the first time only — Maven caches everything after that.
8. Make sure the project is using JDK 17: right-click project → **Properties > Java Build Path >
   Libraries**, and also **Properties > Java Compiler** → compiler level 17. If Eclipse complains,
   go to `Window > Preferences > Java > Installed JREs` and add your JDK 17 installation.

If you see red error markers immediately after import, right-click the project →
**Maven > Update Project... (Alt+F5)** → check "Force Update" → OK.

---

## 3. Run the backend

**Option A — Run as Spring Boot / Java Application**
1. In the Package Explorer, expand:
   `quelorax-backend > src/main/java > com.quelorax.backend > BackendApplication.java`
2. Right-click `BackendApplication.java` → **Run As > Java Application**
   (or **Run As > Spring Boot App** if you have the Spring Tools plugin).
3. Watch the Console — you should see Spring Boot's banner and finally:
   ```
   Tomcat started on port(s): 8080 (http)
   Started BackendApplication in x.xxx seconds
   ```

**Option B — Run with Maven from a terminal**
```bash
cd quelorax-backend
./mvnw spring-boot:run        # or: mvn spring-boot:run
```

The API is now live at **http://localhost:8080**.

On first startup, the app auto-seeds:
- An organization ("Quelorax Organization")
- 3 departments: General Enquiry (GEN), Account Services (ACC), Document Verification (DOC)
- 3 accounts:

| Role         | Email                    | Password       |
|--------------|--------------------------|----------------|
| Admin        | admin@quelorax.app       | admin123       |
| Receptionist | reception@quelorax.app   | reception123   |
| Staff        | staff@quelorax.app       | staff123       |

Data is stored in the `quelorax_db` MySQL database and **persists between restarts** (and
across `docker compose down` as long as you don't also pass `-v`, which would wipe the
volume). Browse it with MySQL Workbench, DBeaver, TablePlus, or the `mysql` CLI:
```bash
mysql -h 127.0.0.1 -P 3306 -u root -proot quelorax_db
```
Want a clean slate? Drop and let it recreate: `docker compose down -v && docker compose up -d`.

---

## 3.5 Configure real OTP delivery (email + SMS)

OTP codes for register / login-with-OTP / forgot-password are **not** returned in the API
response anymore — they're sent for real, to the user's email and phone. You need to supply
credentials for at least one channel (both is recommended) before those flows will work.

**Email (SMTP)** — set these environment variables before starting the app:
```bash
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=you@gmail.com
export MAIL_PASSWORD=xxxxxxxxxxxxxxxx   # a 16-char Gmail "App Password", not your normal password
export MAIL_FROM=you@gmail.com
```
Any standard SMTP provider works the same way (SendGrid, Amazon SES, Mailgun, Outlook, your
company mail server, etc.) — just point `MAIL_HOST`/`MAIL_PORT` at it.

**SMS (Twilio)** — sign up at https://www.twilio.com, grab your Account SID + Auth Token from
the console, and get a Twilio phone number capable of sending SMS:
```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_AUTH_TOKEN=your_auth_token
export TWILIO_FROM_NUMBER=+15551234567
```
User phone numbers must be entered in E.164 format (e.g. `+919876543210`) — the Register form
now enforces this.

**On Eclipse:** set these as environment variables on the Run Configuration
(`Run > Run Configurations… > Environment` tab) rather than `export`-ing them in a shell.

**Behavior if not configured:** if *neither* channel has credentials set, the register/OTP
endpoints will fail with a clear `503` error telling you to configure `MAIL_*`/`TWILIO_*` —
they will not silently "succeed" without actually sending anything. If one channel is
configured and the other isn't, delivery proceeds on the configured channel only.

---



Two files are included in the `postman/` folder:
- `Quelorax-Backend.postman_collection.json`
- `Quelorax-Local.postman_environment.json`

**Import steps:**
1. Open Postman → **Import** → drag in both files (or select them).
2. Top-right environment dropdown → select **"Quelorax Local"**.
3. Open the **Auth** folder → run **"Login (Admin)"**. This automatically captures the JWT
   into the `{{token}}` collection variable (via a small test script), so every other request
   that has `Authorization: Bearer {{token}}` will work right away.
4. Open **Departments > Get All Departments** — this also auto-captures a `{{departmentId}}`.
5. Try **Queue Tokens > Book Token (Create)**, then the various queue actions (check-in, delay,
   priority, call/complete/skip, etc).

The collection is organized into folders matching the API groups below.

---

## 5. API overview

Base URL: `http://localhost:8080`

### Auth (`/api/auth`) — public, no token required
| Method | Endpoint                          | Purpose |
|--------|------------------------------------|---------|
| POST   | `/register`                       | Create a visitor account, returns a demo OTP |
| POST   | `/verify-registration`            | Verify OTP, returns JWT + user |
| POST   | `/login`                          | Email + password login, returns JWT + user |
| POST   | `/login-otp/request`              | Request an OTP for passwordless login |
| POST   | `/login-otp/verify`               | Verify OTP, returns JWT + user |
| POST   | `/forgot-password`                | Request a password-reset OTP |
| POST   | `/reset-password`                 | Verify OTP + set new password |

> **Demo note:** OTPs are returned directly in the JSON response (`otp` field) instead of being
> emailed/texted, so you can test the whole flow without wiring up a real email/SMS provider.
> Swap `AuthService` to actually send the OTP before going to production.

### Users (`/api/users`) — JWT required
`GET /me` (current user) · `GET /` (admin/receptionist) · `GET /{id}` · `PUT /{id}` ·
`DELETE /{id}` (admin) · `GET /stats/login` (admin)

### Departments (`/api/departments`) — JWT required (writes: admin only)
`GET /` · `GET /{id}` · `POST /` · `PUT /{id}` · `DELETE /{id}`

### Queue Tokens (`/api/tokens`) — JWT required
Full queue lifecycle, mirroring the frontend's queue logic 1:1:
- `POST /` — book a token (ASAP or a future slot)
- `GET /`, `GET /{id}`, `GET /department/{deptId}`, `GET /user/{userId}`
- `GET /department/{deptId}/waiting|delayed|missed` — priority-sorted queue views
- `GET /active?userId=&departmentId=` — a visitor's in-flight tokens for a department
- `PUT /{id}` — generic patch (purpose, name, phone, status, priority)
- `POST /{id}/cancel`, `/checkin`, `/delay`, `/priority`, `/reorder`
- `POST /department/{deptId}/flag-overdue` — flag delayed tokens whose time has passed as "missed"
- `POST /{id}/call`, `/complete`, `/skip` — staff actions

### Documents (`/api/documents`) — JWT required
`GET /user/{userId}` · `POST /` · `PUT /{id}` · `DELETE /{id}`

### Notifications (`/api/notifications`) — JWT required
`GET /?userId=&role=&departmentId=` · `POST /` (broadcast org/department/role/user scoped) ·
`POST /{id}/read?userId=` · `POST /read-all`

### Organization (`/api/org`) — read is public, update is admin-only
`GET /` · `PUT /`

### Settings (`/api/settings`) — JWT required
`GET /` · `PUT /`

---

## 6. Authentication in Postman / your frontend

After login/registration you get:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "name": "...", "email": "...", "role": "ADMIN", ... }
}
```
Send that token on every subsequent request as a header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## 7. Connecting the VS Code frontend to this backend (later step)

The frontend currently talks to `src/store/store.js` (localStorage). To wire it to this API:

1. Keep the backend running on `http://localhost:8080` (already allowed by CORS for
   `http://localhost:5173`, Vite's default dev port — see `app.cors.allowed-origins` in
   `application.properties` if your frontend runs on a different port).
2. In the frontend, add an API client (e.g. a small `src/lib/api.js` using `fetch`) that calls
   `http://localhost:8080/api/...` and stores the JWT (e.g. in memory + `sessionStorage`).
3. Replace the calls inside `AuthContext.jsx` (`findUserByEmail`, `createUser`, `setSession`,
   etc.) with calls to `/api/auth/...`, and replace `store.js`'s token/department/document/
   notification functions with calls to the matching REST endpoints above.
4. This can be done incrementally, page by page — the response shapes were designed to closely
   match the fields your components already expect (`code`, `status`, `priority`, `delayUntil`,
   `checkedInAt`, etc.).

We can do this integration together once you're ready — just say the word and I'll wire up the
API client and update the contexts/pages to call the real backend instead of localStorage.

---

## 8. Database configuration

MySQL is the datastore for every environment (dev, staging, prod) — H2 is only used under the
`test` Spring profile for fast, disk-free automated tests (`src/test/resources/application-test.properties`).

Connection settings are all env-var driven with local-dev defaults baked in, so `docker compose
up -d` + `mvn spring-boot:run` works with zero extra config:

| Env var       | Default       | Purpose                     |
|---------------|---------------|------------------------------|
| `DB_HOST`     | `localhost`   | MySQL host                  |
| `DB_PORT`     | `3306`        | MySQL port                  |
| `DB_NAME`     | `quelorax_db` | Database name (auto-created)|
| `DB_USERNAME` | `root`        | MySQL user                  |
| `DB_PASSWORD` | `root`        | MySQL password               |

For staging/production, set these to point at your managed MySQL instance (RDS, Cloud SQL,
PlanetScale, etc.) rather than relying on the defaults, and switch
`spring.jpa.hibernate.ddl-auto` from `update` to `validate` once the schema has stabilized —
`update` is convenient for active development but riskier to leave on against a production
database long-term (prefer a migration tool like Flyway for controlled schema changes at that
point).

---

## 9. Adding AI later

Once the frontend is wired to this backend, a natural next step is a small `AiController` /
`AiService` that calls an LLM API (e.g. Anthropic's Claude API) for things like:
- Smarter wait-time predictions (the frontend already has `src/utils/aiPredictions.js` as a
  placeholder)
- An AI assistant for staff/admin queue insights
- Auto-drafted broadcast notifications

Let me know when you're ready and we'll design that endpoint together.
