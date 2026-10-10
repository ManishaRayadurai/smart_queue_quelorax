# SYSTEM REQUIREMENTS SPECIFICATION (SRS)
## Full Stack Java (AI-Integrated) Training Programme

---

### PROJECT METADATA

| Item | Details |
| :--- | :--- |
| **Project Title** | **QUELORAX** — Smart Queue and Crowd Flow Management System for Hospitals and Public Offices |
| **Problem Statement ID** | **SIH25 / FSJ28-INTERN-114** |
| **Domain Category** | Smart Cities / Healthcare / Public Safety & Governance |
| **Ministry / Organisation** | Government |
| **Institution** | Karpagam College of Engineering, Coimbatore - 641 032 |
| **Degree** | Bachelor of Technology in Artificial Intelligence and Data Science |
| **Version** | V2.0 |
| **Date** | October 2026 |

---

### DOCUMENT REVISION HISTORY

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **v1.0** | 02.08.2026 | Project Team | Initial draft — System architecture, core microservices, and initial database design. |
| **v1.1** | 25.08.2026 | Project Team | Mid-term review — Added Python AI Machine Learning module for wait-time prediction and crowd forecasting. |
| **v2.0** | 06.10.2026 | Project Team | Final revision — Full microservices implementation, Vite React frontend, FCM push notifications, multilingual support, and dynamic analytics. |

---

# 1. INTRODUCTION

## 1.1 Purpose
This System Requirements Specification (SRS) document details the functional and non-functional requirements for **QUELORAX** (Smart Queue and Crowd Flow Management System for Hospitals and Public Offices), developed under Problem Statement **FSJ28-INTERN-114**. 

The document serves as a standard reference for software engineers, evaluators, hospital/government administrators, and technical reviewers. It outlines the system architecture, microservices breakdown, AI/ML predictive modules, interface specifications, database schemas, and deployment topologies.

## 1.2 Scope
**System Name:**  
`QUELORAX` — Smart Queue and Crowd Flow Management System

**What the system DOES:**
- **Token Generation & Scheduling:** Enables online date and time-slot token booking for visitors, as well as walk-in token generation at physical reception desks.
- **AI-Powered Wait-Time Prediction:** Uses trained Machine Learning models (XGBoost / Random Forest) to calculate personalized queue wait times based on historical queue length, service rate, and time of day.
- **Crowd-Density Forecasting & Counter Optimization:** Analyzes department-wise queue traffic to predict hourly crowd congestion and suggest optimal counter allocations.
- **Real-Time Queue Management & Monitoring:** Provides role-based dashboards for Counter Staff (Call, Start, Complete, Delay, Skip), Receptionists, Department Managers, and Administrators.
- **Multi-Channel Visitor Notifications:** Sends real-time updates via In-App notifications, SMS (Twilio), and Push Notifications (Firebase Cloud Messaging) when a visitor's turn approaches or status changes.
- **Live Display Board:** Renders high-visibility, real-time public queue displays for waiting lounges.
- **Multilingual Support:** Supports English and major Indian regional languages (Hindi, Tamil, Kannada, Telugu, etc.) for public accessibility.

**What the system DOES NOT do (Out of Scope):**
- Physical hardware ticket dispensing machine fabrication (uses standard thermal printers or web/mobile soft tokens).
- Biometric facial recognition entry gates (focused on queue flow and crowding prediction, not facial access control).
- Native iOS/Android compiled binaries (delivered as a responsive Progressive Web Application).

---

## 1.3 Definitions, Acronyms & Abbreviations

| Term / Acronym | Definition |
| :--- | :--- |
| **SRS** | System Requirements Specification |
| **API** | Application Programming Interface |
| **REST** | Representational State Transfer |
| **JWT** | JSON Web Token |
| **AI** | Artificial Intelligence |
| **ML** | Machine Learning |
| **CRUD** | Create, Read, Update, Delete |
| **PWA** | Progressive Web Application |
| **FCM** | Firebase Cloud Messaging |
| **OTP** | One-Time Password |
| **SMS** | Short Message Service |
| **CORS** | Cross-Origin Resource Sharing |
| **XGBoost** | Extreme Gradient Boosting Algorithm |
| **RBAC** | Role-Based Access Control |
| **HTTPS** | HyperText Transfer Protocol Secure |
| **SPA** | Single Page Application |
| **ORM** | Object-Relational Mapping (Hibernate / JPA) |
| **UI / UX** | User Interface / User Experience |
| **KPI** | Key Performance Indicator |

---

# 2. OVERALL DESCRIPTION

## 2.1 Product Perspective
QUELORAX is an intelligent microservices-based web platform designed to eliminate overcrowding in government administrative centers and public hospitals. Currently, public offices suffer from disorganized physical waiting lines, unpredictable wait times, and unbalanced counter workloads.

QUELORAX digitizes the entire lifecycle of a visit:
1. **Pre-Arrival:** Visitor books a slot online or gets a walk-in token at reception.
2. **Waiting:** Visitor tracks real-time queue position and AI estimated wait time on their smartphone.
3. **Service:** Counter staff manage tokens using dedicated dashboards; AI forecasts counter staffing needs.
4. **Completion:** System archives visit logs and aggregates operational analytics.

---

## 2.2 Product Functions — Feature Summary

| # | Feature Name | Description |
| :- | :--- | :--- |
| **1** | **Online Token Booking** | Visitors pick date, department, and time slot to pre-book visit tokens. |
| **2** | **Reception Walk-in Desk** | Receptionists issue instant printed or digital tokens for walk-in visitors. |
| **3** | **AI Wait-Time Prediction** | ML regression models compute accurate wait time estimations per token. |
| **4** | **AI Crowd Forecasting** | Predicts peak crowd density hours and recommends counter counts per department. |
| **5** | **Counter Staff Workstation** | Interface for calling next token, marking in-progress, delaying, or completing. |
| **6** | **Live Queue Display** | Full-screen public display showing called token numbers and counter locations. |
| **7** | **Multi-Channel Alerts** | In-app, SMS, and FCM push notifications on status changes. |
| **8** | **Priority Queue Handling** | Expedites senior citizens, emergency patients, and disabled visitors. |
| **9** | **Real-Time Analytics** | Interactive charts for daily/weekly/monthly token volume, wait times, and resolution rates. |
| **10** | **Multilingual Interface** | Toggle UI text across English, Tamil, Hindi, Kannada, and Telugu. |

---

## 2.3 User Classes and Characteristics

| User Role | Primary Responsibilities | Access Level |
| :--- | :--- | :--- |
| **Visitor / Public** | Books tokens online, checks live status, views waiting lounge display. | Public / Visitor |
| **Counter Staff / Doctor** | Calls next waiting token, manages visit duration, marks tokens complete or delayed. | Staff |
| **Receptionist** | Generates walk-in tokens, assists non-tech visitors, handles cancellations. | Reception |
| **Department Manager** | Monitors live department load, reallocates counters based on AI suggestions. | Manager |
| **System Administrator** | Manages users, department configurations, system settings, and full analytics. | Full Admin |

---

## 2.4 Operating Environment

- **Server Environment:** Docker Containers running on Linux Ubuntu 22.04 LTS or Windows Server 2022.
- **Backend Runtime:** Java 21, Spring Boot 3.3.4 (Microservices Architecture).
- **Frontend Runtime:** React 19, Vite 8, Node.js 24+.
- **AI/ML Runtime:** Python 3.13, FastAPI, Uvicorn, Scikit-learn, XGBoost, Pandas.
- **Database:** MySQL 8.0+ (Separate databases: `quelorax_auth`, `quelorax_queue`, `quelorax_notify`).

---

# 3. SYSTEM ARCHITECTURE

## 3.1 High-Level Architecture
QUELORAX follows a modern decoupled microservices architecture:

```
                          ┌───────────────────────────┐
       Browser / Mobile   │  React SPA (Vite :5173)   │
                          └─────────────┬─────────────┘
                                        │ HTTP / REST (JWT)
                                        ▼
                          ┌───────────────────────────┐
                          │   api-gateway (:8080)     │
                          └─────────────┬─────────────┘
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
   ┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
   │    auth-service    │    │   queue-service    │    │ notification-srv   │
   │      (:8081)       │    │      (:8082)       │    │      (:8083)       │
   │  DB: quelorax_auth │    │  DB: quelorax_queue│    │  DB: quelorax_notif│
   └────────────────────┘    └──────────┬─────────┘    └────────────────────┘
                                        │ REST
                                        ▼
                             ┌────────────────────┐
                             │ quelorax-ai-service│
                             │      (:8084)       │
                             │   Python FastAPI   │
                             └────────────────────┘
```

---

## 3.2 Microservices Breakdown

| # | Microservice Name | Port | Database | Primary Responsibility |
| :- | :--- | :--- | :--- | :--- |
| **1** | **API Gateway** | `8080` | — | Single public entry point, request routing, CORS deduplication, JWT validation. |
| **2** | **Auth Service** | `8081` | `quelorax_auth` | User registration, login, JWT issuance, OTP verification, profile management. |
| **3** | **Queue Service** | `8082` | `quelorax_queue` | Token creation, department setup, priority handling, status transitions. |
| **4** | **Notification Service**| `8083` | `quelorax_notify`| In-app alerts, FCM push notifications, SMS delivery via Twilio. |
| **5** | **AI Microservice** | `8084` | Stateless | FastAPI service running ML models for wait times and crowd forecasting. |

---

# 4. FUNCTIONAL REQUIREMENTS

## 4.1 Auth Service (FR-AUTH)

### FR-AUTH-001: User Registration & Verification
- **Description:** Allows visitors and staff to register with name, email, mobile number, and password.
- **Workflow:** System validates input, generates email OTP, and creates user in `quelorax_auth`.

### FR-AUTH-002: User Authentication & JWT Issuance
- **Description:** Authenticates credentials and returns a signed JWT valid for 24 hours.

---

## 4.2 Queue Service (FR-QUEUE)

### FR-QUEUE-001: Token Booking & Generation
- **Description:** Visitor selects date, department, and time slot. System verifies slot availability and issues token code (e.g. `GEN-005`).

### FR-QUEUE-002: Counter Token Progression
- **Description:** Staff clicks "Call Next". Status changes from `WAITING` -> `CALLED` -> `IN_PROGRESS` -> `COMPLETED`.

---

## 4.3 AI Service (FR-AI)

### FR-AI-001: Machine Learning Wait-Time Prediction
- **Description:** Given department queue length and current time, returns estimated wait time in minutes using trained XGBoost regression models.

### FR-AI-002: Crowd Density Forecasting
- **Description:** Analyzes historical booking volume to forecast peak traffic hours and recommend optimal staff counter deployment.

---

# 5. NON-FUNCTIONAL REQUIREMENTS

| Category | Requirement | Target Metric |
| :--- | :--- | :--- |
| **Performance** | API Gateway response latency | `< 200 ms` for 95% of requests |
| **AI Speed** | ML inference latency | `< 100 ms` per prediction |
| **Availability** | System Uptime | `99.9%` continuous operation |
| **Security** | Password Storage & JWT | BCrypt adaptive hashing, 256-bit JWT secret |
| **Usability** | Mobile Responsiveness | Fully functional on viewports `≥ 360px` |

---

# 6. DATABASE SCHEMAS

### Table: `users` (`quelorax_auth`)
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `phone` (VARCHAR)
- `password` (VARCHAR)
- `role` (ENUM: `VISITOR`, `STAFF`, `RECEPTIONIST`, `MANAGER`, `ADMIN`)

### Table: `queue_tokens` (`quelorax_queue`)
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `code` (VARCHAR, e.g. `CARD-012`)
- `department_id` (BIGINT, FK)
- `visitor_name` (VARCHAR)
- `booking_date` (VARCHAR)
- `booking_time` (VARCHAR)
- `status` (ENUM: `WAITING`, `CALLED`, `IN_PROGRESS`, `COMPLETED`, `MISSED`, `CANCELLED`)
- `created_at` (BIGINT)

---

# 7. CONCLUSION & VERIFICATION SUMMARY

The **QUELORAX** platform successfully implements all functional and architectural specifications required under **SIH25 / FSJ28-INTERN-114**. The system has been validated across microservices compilation, database migrations, AI model inference, and frontend user workflows.

---
*End of System Requirements Specification — Version 2.0*
