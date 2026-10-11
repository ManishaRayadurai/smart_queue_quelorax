# ⚡ Quelorax — Smart Queue & Crowd Flow Management System

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.x-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow?logo=python)](https://python.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](https://mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **SIH25 / FSJ28-INTERN-114**  
> An enterprise-grade, AI-integrated queue management and crowd forecasting platform designed for hospitals, government administrative centers, and public institutions.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Microservices Breakdown](#-microservices-breakdown)
- [Key Features](#-key-features)
  - [Role-Based Portals](#role-based-portals)
  - [AI & Predictive Engine](#ai--predictive-engine)
  - [Real-Time Notifications & Displays](#real-time-notifications--displays)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#1-database-setup)
  - [Running Microservices (Backend)](#2-running-microservices-backend)
  - [Running AI Prediction Service](#3-running-ai-prediction-service)
  - [Running Frontend Application](#4-running-frontend-application)
  - [Running via Docker Compose](#running-via-docker-compose-alternative)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

Long physical waiting lines cause congestion, customer frustration, and staff burnout in public service centers and healthcare facilities. **Quelorax** solves this by providing:

1. **Self-Service Smart Booking:** Online time-slot booking and on-premise walk-in token generation.
2. **AI-Driven Wait-Time Predictions:** Real-time queue duration estimates using trained Machine Learning models.
3. **Crowd Congestion Forecasting:** Proactive counter-allocation suggestions for peak hours.
4. **Multi-Channel Alerts:** Live updates delivered via In-App notifications, SMS (Twilio), and Push Notifications (Firebase Cloud Messaging).
5. **Live Waiting Lounge Display:** Real-time counter calling with Web Speech API audio announcements.

---

## 🏗️ System Architecture

Quelorax follows a decentralized microservices architecture deployed behind an API Gateway:

```
                            ┌──────────────────────────────────┐
                            │    Quelorax React Frontend       │
                            │      (Vite Dev :5173 / PWA)      │
                            └────────────────┬─────────────────┘
                                             │ HTTP / REST
                                             ▼
                            ┌──────────────────────────────────┐
                            │    Spring Cloud API Gateway      │
                            │       (Port 8080 - Entry)        │
                            └────────────────┬─────────────────┘
                                             │
            ┌────────────────────────────────┼────────────────────────────────┐
            ▼                                ▼                                ▼
  ┌───────────────────┐            ┌───────────────────┐            ┌───────────────────┐
  │   auth-service    │            │   queue-service   │            │notification-servic│
  │     Port 8081     │            │     Port 8082     │            │     Port 8083     │
  ├───────────────────┤            ├───────────────────┤            ├───────────────────┤
  │ • Users & RBAC    │            │ • Departments     │            │ • In-App Alerts   │
  │ • OTP & Auth      │            │ • Token Booking   │            │ • Firebase Push   │
  │ • Google OAuth    │            │ • Queue Lifecycle │            │ • Twilio SMS      │
  │ • Org & Settings  │            │ • Documents       │            │ • Broadcasts      │
  ├───────────────────┤            ├───────────────────┤            ├───────────────────┤
  │ DB: quelorax_auth │            │ DB: quelorax_queue│            │ DB: quelorax_notif│
  └───────────────────┘            └─────────┬─────────┘            └─────────▲─────────┘
                                             │                                │
                                             │ Internal REST Service Events   │
                                             └────────────────────────────────┘
                                                             │
                                             ┌───────────────▼────────────────┐
                                             │      quelorax-ai-service       │
                                             │           (Port 8000)          │
                                             ├────────────────────────────────┤
                                             │ • ML Wait Time Estimator       │
                                             │ • Hourly Crowd Forecaster      │
                                             └────────────────────────────────┘
```

---

## 🧩 Microservices Breakdown

| Service | Port | Database | Primary Responsibility |
| :--- | :---: | :--- | :--- |
| **`api-gateway`** | `8080` | *None* | Central routing, CORS preflight handling, load balancing, and rate limiting. |
| **`auth-service`** | `8081` | `quelorax_auth` | Authentication, RBAC, JWT issuance, Email/SMS OTP, Google OAuth2, Organization settings. |
| **`queue-service`** | `8082` | `quelorax_queue` | Department management, time-slot scheduling, token generation, queue status state machine. |
| **`notification-service`** | `8083` | `quelorax_notify` | FCM push notification delivery, SMS dispatch, department-wide broadcast notifications. |
| **`quelorax-ai-service`** | `8000` | *N/A* | Machine learning inference for wait times (`wait_time_model.joblib`) and crowd density (`crowd_forecast_model.joblib`). |
| **`monolith-reference`** | `8080` | `quelorax_db` | Standalone single-jar legacy backend preserved for benchmarking and fallback. |

---

## 🚀 Key Features

### Role-Based Portals

- **👤 Visitor Portal:**
  - Reserve date and time-slot tokens up to 5 days in advance.
  - Live queue tracking with estimated wait time and position.
  - Digital token QR ticket download & document attachment.
  - Multilingual interface (English, Hindi, Tamil, Telugu, Kannada, etc.).

- **🎫 Receptionist Desk:**
  - Instant walk-in token issuance with thermal print formatting.
  - Real-time visitor search, appointment verification, and token cancellation.

- **👨‍💼 Counter Staff Dashboard:**
  - One-click token actions: `Call Next`, `Start Serving`, `Complete`, `Delay`, `Mark Missed`, `Transfer`.
  - Automatic visitor notification triggers on state change.
  - Individual counter analytics (service duration, tokens processed).

- **📊 Administrator Dashboard:**
  - Real-time queue monitor across all facility departments.
  - Dynamic analytics: Daily, weekly, and monthly footfall trends.
  - Department configuration, counter allocation, and staff management.
  - Instant emergency and operational broadcast announcements.

- **📺 Live Display Board:**
  - High-visibility screen for waiting areas.
  - Voice announcement synthesis using Web Speech API ("Token A-102 please proceed to Counter 3").

### AI & Predictive Engine

- **Wait Time Regression:** Random Forest / XGBoost model predicting queue wait times based on historical queue length, service speed, hour of day, and department traffic.
- **Crowd Congestion Forecasting:** Predicts hourly footfall to recommend dynamic counter staffing before bottlenecks occur.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React, Canvas Confetti, HTML5 QR Scanner.
- **Backend:** Java 17+, Spring Boot 3.x, Spring Cloud Gateway, Spring Data JPA, Spring Security (JWT).
- **AI & Analytics:** Python 3.10+, FastAPI / Flask, Scikit-learn, Joblib, Pandas, NumPy.
- **Database & Storage:** MySQL 8.x, HikariCP connection pooling.
- **Messaging & Notifications:** Firebase Cloud Messaging (Web Push), Twilio SMS API, Spring JavaMail (SMTP).
- **Containerization:** Docker, Docker Compose.

---

## 📁 Repository Structure

```
smart_queue_quelorax/
├── ai_models/                             # Pre-trained ML models (.joblib)
├── quelorax-frontend/                     # React + Vite web application
│   ├── src/
│   │   ├── api/                           # Centralized REST clients
│   │   ├── components/                    # Reusable UI components & modals
│   │   ├── contexts/                      # Auth, Language, Notification contexts
│   │   ├── pages/                         # Admin, Staff, Receptionist, Visitor pages
│   │   └── utils/                         # AI prediction, voice, and slot helpers
│   └── vite.config.js
├── quelorax-backend-microservices/        # Spring Boot microservices
│   ├── api-gateway/                       # Port 8080
│   ├── auth-service/                      # Port 8081
│   ├── queue-service/                     # Port 8082
│   ├── notification-service/              # Port 8083
│   ├── mysql-init/                        # Database initialization scripts
│   └── docker-compose.yml
├── quelorax-ai-service/                   # Python AI inference service
│   └── ai_server.py
├── quelorax-backend-monolith-reference/   # Legacy monolith backend
├── postman/                               # Complete API test collection
├── SRS_QUELORAX_FSJ28_INTERN_114.md       # Full System Requirements Specification
└── README.md                              # Main documentation
```

---

## ⚡ Getting Started

### Prerequisites

Ensure the following tools are installed on your machine:
- **Java JDK 17** or higher (`java -version`)
- **Node.js 18+** and **npm** (`node -v`)
- **Python 3.10+** (`python --version`)
- **MySQL Server 8.0+**
- *(Optional)* **Docker & Docker Compose**

---

### 1. Database Setup

Log into MySQL and execute the database creation:

```sql
CREATE DATABASE IF NOT EXISTS quelorax_auth;
CREATE DATABASE IF NOT EXISTS quelorax_queue;
CREATE DATABASE IF NOT EXISTS quelorax_notify;
```

---

### 2. Running Microservices (Backend)

Open separate terminal windows for each service inside `quelorax-backend-microservices/`:

#### A. Auth Service (Port 8081)
```bash
cd quelorax-backend-microservices/auth-service
mvn spring-boot:run
```

#### B. Queue Service (Port 8082)
```bash
cd quelorax-backend-microservices/queue-service
mvn spring-boot:run
```

#### C. Notification Service (Port 8083)
```bash
cd quelorax-backend-microservices/notification-service
mvn spring-boot:run
```

#### D. API Gateway (Port 8080)
```bash
cd quelorax-backend-microservices/api-gateway
mvn spring-boot:run
```

---

### 3. Running AI Prediction Service

Navigate to the AI service directory and install requirements:

```bash
cd quelorax-ai-service
pip install -r requirements.txt
python ai_server.py
```
*The AI service will start listening on `http://localhost:8000`.*

---

### 4. Running Frontend Application

Navigate to the frontend folder, install dependencies, and start the development server:

```bash
cd quelorax-frontend
npm install
npm run dev
```

Open your browser at:  
👉 **`http://localhost:5173`**

---

### Running via Docker Compose (Alternative)

To launch the complete infrastructure using Docker:

```bash
cd quelorax-backend-microservices
docker compose up --build -d
```

---

## 🔐 Environment Variables

### Frontend (`quelorax-frontend/.env`)
```ini
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### Backend Microservices (`application.properties`)
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/quelorax_auth?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password

# JWT Authentication
app.jwt.secret=quelorax-super-secret-key-change-this-in-production-0123456789ABCDEF
app.jwt.expiration-ms=86400000

# Email Delivery (SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# Twilio SMS
app.twilio.account-sid=your-twilio-sid
app.twilio.auth-token=your-twilio-auth-token
app.twilio.from-number=+1XXXXXXXXXX
```

---

## 📡 API Documentation

Import the included Postman collection at:  
📂 `postman/quelorax_postman_collection.json`

### Core Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new user |
| **Auth** | `POST` | `/api/auth/login` | Login & receive JWT |
| **Auth** | `POST` | `/api/auth/google` | Google OAuth token sign-in |
| **Queue** | `GET` | `/api/departments` | Fetch departments & counter status |
| **Queue** | `POST` | `/api/tokens/book` | Book scheduled or walk-in token |
| **Queue** | `GET` | `/api/tokens/my` | Retrieve active visitor token |
| **Queue** | `PUT` | `/api/tokens/{id}/status` | Counter staff status updates |
| **Alerts** | `GET` | `/api/notifications` | Fetch user alerts & announcements |
| **AI** | `POST` | `/api/ai/predict-wait-time` | Predict waiting duration |

---

## 👥 Roles & Default Demo Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@quelorax.app` | `Admin@123` | `/admin/dashboard` |
| **Counter Staff** | `staff@quelorax.app` | `Staff@123` | `/staff/dashboard` |
| **Receptionist** | `reception@quelorax.app` | `Reception@123` | `/reception/dashboard` |
| **Visitor** | *Register via UI* | *Self-assigned* | `/visitor/dashboard` |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed for **Smart India Hackathon / Full Stack Java Training Programme (FSJ28-INTERN-114)**.
