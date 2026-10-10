# What's in this delivery

Everything built across our conversation, in order:

## 1. Date + time based token booking (visitor "Book a token" form)
- Date picker (Today / Tomorrow / next 5 days) above the existing time
  picker in `quelorax-frontend/src/pages/visitor/BookToken.jsx` and
  `src/utils/slots.js`.
- Once a date/time slot has passed, it's greyed out client-side AND
  rejected server-side (`400 Bad Request`) in `QueueTokenService.createToken`
  — enforced in both the monolith and queue-service.

## 2. Announcements JSON bug — fixed
`Notification.readBy` was a lazily-loaded collection accessed after
Hibernate's session had already closed. Changed to eager-load and made the
read path `@Transactional`.

## 3. Reception dashboard — added Cancel booking
The main Reception dashboard's "Recent walk-ins" list was read-only; added
a Cancel button there.

## 4. Backend split into microservices
`quelorax-backend-microservices/` — 4 independently runnable services
behind an API gateway. **Read `README-MICROSERVICES.md` in that folder
first.**

- **api-gateway** (:8080) — public entry point
- **auth-service** (:8081) — users, organization, settings, OTP/Google login
- **queue-service** (:8082) — departments, queue tokens, documents
- **notification-service** (:8083) — notifications, FCM push, SMS

`quelorax-backend-monolith-reference/` — original single-service backend,
kept for comparison/rollback. **Don't run alongside `api-gateway`** — both
default to port 8080.

## 5. Queue status changes now notify the visitor
Token being called, delayed, marked missed, or completed now sends a
notification to that specific visitor (in-app always; SMS/push if
configured): "It's your turn!", "Your visit has been delayed", "You missed
your scheduled time", "Visit complete", "You were skipped".

Microservices: `queue-service` → internal-only API on `notification-service`
(`QueueNotificationClient.java` / `InternalNotificationController.java`).
Monolith: direct in-JVM call, no REST hop.

## 6. Gateway CORS + build fixes
- `DedupeResponseHeader` filter in `api-gateway/application.yml` — fixes a
  duplicate `Access-Control-Allow-Origin` header that caused "Failed to
  fetch".
- Pinned `spring-cloud.version` to `2023.0.3`.

## 7. Firebase push notifications — wired end to end
Backend had FCM endpoints, but the frontend never called them. Now:
- `quelorax-frontend/src/firebase.js` — requests push permission, gets a
  device token
- `public/firebase-messaging-sw.js` — background push handling
- `NotificationContext.jsx` — registers the token on login, unregisters on
  logout, shows a native notification for foreground pushes

**To enable**: Firebase Console → generate a service-account key → replace
`notification-service/firebase-service-account.json`; add a Web app →
copy the config into `quelorax-frontend/.env`'s `VITE_FIREBASE_*` fields
and also into `public/firebase-messaging-sw.js` (it can't read `.env`);
generate a VAPID key → `VITE_FIREBASE_VAPID_KEY`; `npm install` (new
`firebase` package); restart frontend + `notification-service`.

## 8. Registration OTP — added Resend
There was no way to resend a registration OTP, and re-submitting the
registration form to get a new code would have failed with `409 Email
already registered`. Added:
- `POST /api/auth/resend-registration-otp` (auth-service + monolith) —
  only works for an email that's registered but not yet verified
- "Resend code" button with a 30-second cooldown on `Register.jsx`'s OTP
  step
- New Postman request: "Resend Registration OTP", right after "Verify
  Registration"

## 9. Login OTP and Password Reset — added Resend
Same gap existed in two more places — fixed both, same pattern (30-second
cooldown "Resend code" button, reusing the existing idempotent
`requestLoginOtp` / `requestReset` calls under the hood, no backend changes
needed since these two were already safe to call repeatedly):
- `Login.jsx` (OTP mode) — resend button next to the OTP field
- `ResetPassword.jsx` — resend button on the reset form (starts with a
  30s cooldown already running, since arriving on this page means a code
  was just sent from the Forgot Password page)

## 10. Settings "Save changes" — now redirects to dashboard
`ProfilePanel` (Settings → Profile tab) saved correctly but never
navigated anywhere — it just sat on the Settings page showing a brief
"Saved" checkmark. Now it navigates to `/app` (the dashboard) ~700ms after
a successful save, giving enough time to see the confirmation first.

## Note on "Continue with Google" asking for a password
Not a bug — `GoogleSignInButton.jsx` opens Google's own real OAuth popup;
our app never shows or checks a password for that flow. "Incorrect
password" after clicking it is Google's own login screen rejecting the
Google account password typed in — nothing in this codebase is involved.
Direct people to https://accounts.google.com/signin/recovery if they've
genuinely forgotten their Google password.

## `.env` files
- `quelorax-frontend/.env` — `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`
  filled in; `VITE_FIREBASE_*` blank by default
- Backend service `.env`/properties — Twilio/SMTP/Firebase blank by
  default; features just don't activate until filled in, nothing breaks

---

## Running it

**Order matters** — start one at a time, waiting for each to fully start:
1. `auth-service` → `AuthServiceApplication` (8081)
2. `queue-service` → `QueueServiceApplication` (8082)
3. `notification-service` → `NotificationServiceApplication` (8083)
4. `api-gateway` → `ApiGatewayApplication` (8080)
5. `quelorax-frontend` → `npm install && npm run dev` (5173)

Or with Docker: `cd quelorax-backend-microservices && docker compose up --build`.

**Postman:** import both files in `postman/` — `base_url` already points
at the gateway, nothing to change.

## OTP & notification delivery recap

All optional — without them, things still work in-app, they just don't
reach a real phone/inbox:

- **Email (SMTP)**: `MAIL_USERNAME` / `MAIL_PASSWORD` (Gmail App Password)
  / `MAIL_FROM` on `auth-service`'s Run Configuration → Environment
- **SMS (Twilio)**: `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` /
  `TWILIO_FROM_NUMBER` on **both** `auth-service` and
  `notification-service`
- **Push (Firebase)**: see section 7 above
