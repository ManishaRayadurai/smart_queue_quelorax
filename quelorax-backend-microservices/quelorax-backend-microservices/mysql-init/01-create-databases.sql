-- Runs automatically the first time the `mysql` container starts (empty data volume only).
-- Each microservice owns exactly one of these databases — see README-MICROSERVICES.md.
CREATE DATABASE IF NOT EXISTS quelorax_auth   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS quelorax_queue  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS quelorax_notify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
