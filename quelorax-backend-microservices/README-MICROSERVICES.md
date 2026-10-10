# Quelorax backend — microservices

The monolithic `quelorax-backend` has been split into 4 independently
runnable Spring Boot services. The frontend and Postman collection still
talk to a single base URL (`http://localhost:8080`) — that's the
**api-gateway**, which is the only public entry point. Nothing on the
client side changes.

```
                      ┌────────────────────┐
   Frontend / Postman │   api-gateway :8080 │   <- the ONLY public entry point
                      └─────────┬──────────┘
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
   ┌─────────────────┐ ┌──────────────────┐ ┌────────────────────────┐
   │ auth-service     │ │ queue-service     │ │ notification-service   │
   │ :8081            │ │ :8082             │ │ :8083                  │
   │ users, org,      │ │ departments,      │ │ notifications,         │
   │ settings, OTP/   │ │ queue tokens,     │ │ FCM push tokens        │
   │ Google login     │ │ documents         │ │                        │
   │ DB: quelorax_auth│ │ DB: quelorax_queue│ │ DB: quelorax_notify    │
   └─────────────────┘ └──────────────────┘ └───────────┬────────────┘
                                                          │ internal REST
                                     (looks up user phone / active tokens)
                                            ▲                       ▲
                                            └───────────┬───────────┘
                                          /api/internal/** on
                                          auth-service & queue-service
```

## Why these boundaries

- **auth-service** owns everything about *who* someone is: `users`,
  `organization`, `settings`, OTP codes, Google sign-in verification.
- **queue-service** owns everything about *the queue*: `departments`,
  `queue_tokens`, `documents`.
- **notification-service** owns *notifications* and FCM push tokens. It's
  the one service that needs data it doesn't own (a user's phone number for
  SMS, which visitors have an active token in a department for a
  "department" broadcast) — see "Service-to-service calls" below.
- **api-gateway** owns nothing but routing + CORS. It's a thin Spring Cloud
  Gateway app; see `api-gateway/src/main/resources/application.yml` for the
  three routes.

Each service has **its own MySQL database** (`quelorax_auth`,
`quelorax_queue`, `quelorax_notify`) on a shared MySQL server — no service
reaches into another service's tables directly, which is the whole point
of doing this. Where the monolith used to just call another domain's
repository in the same JVM, that's now a REST call.

## Service-to-service calls

`notification-service` needs two things it doesn't own:
1. A user's phone number, to send an SMS alert.
2. Which visitors currently have an active token in a department, for
   "notify everyone waiting in Department X" broadcasts.

Rather than give it a copy of the `users` or `queue_tokens` tables, it
calls two small internal-only endpoints:
- `GET auth-service:8081/api/internal/users/{id}`, `/api/internal/users`,
  `/api/internal/users/role/{role}` — see `InternalUserController`.
- `GET queue-service:8082/api/internal/tokens/department/{deptId}` — see
  `InternalTokenController`.

**These `/api/internal/**` paths are never proxied by the gateway** (check
`api-gateway/.../application.yml` — there's no route for them), so they're
only reachable by another backend service calling directly on its internal
port, never from the public internet or the frontend. That's a deliberate,
common simplification for a project this size; a production deployment
would additionally lock this down at the network layer (private subnet /
service mesh) or with a shared internal API key/mTLS — this repo doesn't
add that machinery so it stays easy to run locally.

## What changed from the monolith

- `FcmToken` (push-notification device tokens) moved fully into
  `notification-service` — in the monolith it was written by
  `UserController` but read by `NotificationService`, which only worked
  because they shared one database. `POST /api/users/fcm-token` is now
  `POST /api/notifications/fcm-token` (unused by the current frontend, so
  this is a clean move, not a breaking change).
- JWTs are still validated independently by every service (each has its
  own copy of `JwtAuthFilter` / `JwtUtil`) using the **same shared secret**
  (`app.jwt.secret` in every `application.properties`) — so a token issued
  by auth-service is accepted by queue-service and notification-service
  without any of them calling auth-service to check it. Change the secret
  in all three together if you ever rotate it.
- Seed data: `auth-service`'s `DataSeeder` creates the demo `STAFF` user
  with `departmentId = 1L`, assuming `queue-service`'s `DataSeeder` runs
  first and creates "General Enquiry" as department id 1. Fine for fresh
  demo databases; a real system would look the id up via the API instead
  of assuming it.

## Running it

### Option A — Docker Compose (easiest)
```
cd microservices
docker compose up --build
```
This starts a shared MySQL 8 container plus all 4 services, with the right
hostnames/ports/DB credentials already wired up (`mysql-init/` auto-creates
the three databases on first boot). Gateway is on `http://localhost:8080`.
Data persists across restarts in the `quelorax_mysql_data` volume; wipe it
with `docker compose down -v` for a clean slate.

### Option B — plain Maven, 4 terminals + your own MySQL
1. Start a MySQL 8 server (locally installed, or `docker run -p 3306:3306
   -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0`). The three databases
   (`quelorax_auth`, `quelorax_queue`, `quelorax_notify`) auto-create
   themselves on each service's first connection — no manual `CREATE
   DATABASE` needed if the user has privileges.
2. Each service is a normal standalone Spring Boot Maven project — import
   each one into Eclipse/IntelliJ separately, or from the command line:
   ```
   cd auth-service && mvn spring-boot:run          # :8081
   cd queue-service && mvn spring-boot:run          # :8082
   cd notification-service && mvn spring-boot:run   # :8083
   cd api-gateway && mvn spring-boot:run            # :8080
   ```
   Start `auth-service` and `queue-service` first (for the seed-data
   ordering noted above), then `notification-service`, then `api-gateway`
   last.
3. If your MySQL isn't `localhost:3306` with user `root` / password `root`,
   override via env vars before each `mvn spring-boot:run`:
   `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` (the `DB_NAME` for
   each service is already set correctly in its `application.properties`
   and doesn't need overriding).

### Frontend / Postman
No changes needed — both already point at `http://localhost:8080`.

### Inspecting the databases
Connect with MySQL Workbench, DBeaver, TablePlus, or the CLI — one
connection, three databases (or four including `quelorax_db` if the
monolith has also been run against the same server):
```
mysql -h 127.0.0.1 -P 3306 -u root -proot
mysql> SHOW DATABASES;
mysql> USE quelorax_auth;   -- or quelorax_queue / quelorax_notify
```

## Known simplifications (intentional, for a project this size)

- No service discovery (Eureka/Consul) — the gateway and
  `notification-service` use static URLs (overridable via env vars for
  Docker/Kubernetes). Fine at 4 services; worth adding if this grows.
- No distributed tracing / circuit breakers (Resilience4j, Sleuth) — calls
  between services fail soft (e.g. a broadcast skips a recipient it can't
  reach) rather than retrying, which is enough for this app's use case.
- Internal APIs are protected only by not being routed through the
  gateway, not by an additional auth layer — see the note above.
- The original monolith (`quelorax-backend-updatedgooglecom/`) is still
  included alongside these services for reference/comparison, but it's the
  microservices under `microservices/` that reflect the current, supported
  architecture going forward.
