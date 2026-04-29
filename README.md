# 🏷️ Bid & Buy — Your Campus Auction

<div align="center">

![Bid & Buy Banner](https://img.shields.io/badge/Bid%20%26%20Buy-Campus%20Auction%20Platform-6C3DE1?style=for-the-badge&logo=java&logoColor=white)

[![Java](https://img.shields.io/badge/Java%2017-Spring%20Boot%203.5.6-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://www.java.com)
[![React](https://img.shields.io/badge/React%2018-TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL%208.0-Database-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Academic%20Use-green?style=flat-square)](LICENSE)

> **A verified, campus-only auction marketplace for CUET students and staff to list, bid, and trade second-hand goods transparently and securely.**

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Design](#-system-design)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Screenshots](#-screenshots)
- [Team Members](#-team-members)
- [Course Information](#-course-information)
- [Future Scope](#-future-scope)

---

## 🎯 About the Project

**Bid & Buy** is a web-based campus auction platform developed as part of the **Software Development with Java (CSE-202)** course at **Chittagong University of Engineering and Technology (CUET)**.

Campus communities often trade used goods through unstructured channels — notice boards, chat groups, or social media — that lack accountability, search functionality, and fair pricing mechanisms. **Bid & Buy** solves this by providing:

- 🔐 **Verified access** via institutional CUET email & OTP
- 🕒 **Time-bounded auctions** with automated winner selection
- 💬 **In-app messaging** between buyers and sellers
- 🛡️ **Admin moderation** for listings, reports, and user management
- 📊 **Analytics** for platform insights

---

## ✨ Features

### 👤 User Features
| Feature | Description |
|---|---|
| OTP Registration | Secure sign-up using CUET institutional email with OTP verification |
| Browse & Search | Filter items by category, price, condition, and location |
| Place Bids | Compete in time-limited auctions with real-time bid tracking |
| Buy Now | Instant purchase option if seller enables it |
| Post Items | List second-hand goods with photos, description, and auction settings |
| In-App Messaging | Private chat with sellers/buyers without sharing contact info |
| Bid History | View full bidding history for any auction |
| Report Items | Flag inappropriate listings or users |

### 🛠️ Admin Features
| Feature | Description |
|---|---|
| Item Moderation | Approve or reject user-submitted listings |
| User Management | Warn or ban users for policy violations |
| Report Review | Investigate and resolve submitted reports |
| Dashboard Analytics | Monitor listings, bids, and user activity |

---

## 🛠️ Tech Stack

### Backend
- **Language:** Java 17
- **Framework:** Spring Boot 3.5.6
- **Modules:** Spring Web, Spring Data JPA, Spring Security, Spring Mail
- **Authentication:** JWT (jjwt) + OTP-based email verification
- **Build Tool:** Maven

### Frontend
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (with PostCSS & Autoprefixer)
- **Routing:** react-router-dom
- **Icons:** lucide-react
- **Linting:** ESLint

### Database
- **DBMS:** MySQL 8.0
- **ORM:** Hibernate (via Spring Data JPA)

### Tools & Platforms
- **Version Control:** Git & GitHub
- **IDE:** IntelliJ IDEA (backend), VS Code (frontend)
- **Runtime:** Node.js & npm
- **Documentation:** LaTeX (Overleaf)

---

## 🏗️ System Design

### Architecture
The application follows a **layered MVC architecture**:

```
┌─────────────────────────────────┐
│        React Frontend           │  ← TypeScript, Tailwind CSS
├─────────────────────────────────┤
│     Spring Boot REST API        │  ← Controllers, Services, Repositories
├─────────────────────────────────┤
│     Spring Security + JWT       │  ← Authentication & Authorization
├─────────────────────────────────┤
│         MySQL Database          │  ← JPA/Hibernate ORM
└─────────────────────────────────┘
```

### Core Entities (ER Model)
The database is structured around **7 main entities**:

```
Admin ──────── moderates ──────► Item ◄──── trades ──── User
  │                                │                      │
  └── reviews ──► Report ◄── files─┘           places ──►│
                                            Bid ──────────┘
                                User ◄── is verified ── Pending_Registrations
                                User ──── sends/receives ──► Message
```

### Key Modules
1. **Authentication & Authorization** — Spring Security + JWT + OTP
2. **Auction & Bidding** — Time-bounded listings, bid validation, auto winner selection
3. **Item Management** — Listings, categories, image upload, search & filter
4. **Messaging** — Private in-app buyer-seller communication
5. **Admin & Moderation** — Content approval, reporting, user warnings
6. **Notification & Email** — Spring Mail for OTP and bid alerts

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Java 17+](https://adoptium.net/)
- [Maven 3.8+](https://maven.apache.org/)
- [Node.js 18+ & npm](https://nodejs.org/)
- [MySQL 8.0+](https://dev.mysql.com/downloads/)
- [Git](https://git-scm.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Bid-N-Buy.git
cd Bid-N-Buy
```

---

### 2. Database Setup

```sql
CREATE DATABASE BidNBuy;
```

---

### 3. Backend Setup

Navigate to the backend directory and configure the application:

```bash
cd backend
```

Update `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/BidNBuy
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# JWT Secret
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000

# Mail (for OTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

Run the backend:

```bash
mvn spring-boot:run
```

The API will start at: `http://localhost:8080`

---

### 4. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will start at: `http://localhost:5173`

---

## 📁 Project Structure

```
Bid-N-Buy/
│
├── backend/                          # Spring Boot Application
│   ├── src/main/java/
│   │   └── com/bidnbuy/
│   │       ├── controller/           # REST API Controllers
│   │       ├── service/              # Business Logic
│   │       ├── repository/           # JPA Repositories
│   │       ├── model/                # Entity Classes
│   │       │   ├── User.java
│   │       │   ├── Item.java
│   │       │   ├── Bid.java
│   │       │   ├── Auction.java
│   │       │   ├── Message.java
│   │       │   ├── Report.java
│   │       │   └── PendingRegistration.java
│   │       ├── security/             # JWT & Spring Security Config
│   │       └── dto/                  # Data Transfer Objects
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── frontend/                         # React Application
│   ├── src/
│   │   ├── components/               # Reusable UI Components
│   │   ├── pages/                    # Page-level Components
│   │   ├── services/                 # API Calls
│   │   ├── hooks/                    # Custom React Hooks
│   │   └── types/                    # TypeScript Interfaces
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🔌 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/verify-otp` | Verify OTP for registration |
| `POST` | `/api/auth/login` | User login (returns JWT) |
| `GET` | `/api/items` | Get all approved items |
| `POST` | `/api/items` | Post a new item |
| `GET` | `/api/items/{id}` | Get item details |
| `POST` | `/api/bids` | Place a bid on an item |
| `GET` | `/api/bids/{itemId}` | Get all bids for an item |
| `POST` | `/api/messages` | Send a message |
| `GET` | `/api/messages/{userId}` | Get user messages |
| `POST` | `/api/reports` | Submit a report |
| `GET` | `/api/admin/items/pending` | Admin: get pending items |
| `PUT` | `/api/admin/items/{id}/approve` | Admin: approve an item |
| `PUT` | `/api/admin/users/{id}/warn` | Admin: warn a user |

> 🔒 All endpoints (except auth) require a valid **JWT token** in the `Authorization: Bearer <token>` header.

---

## 📸 Screenshots

| Module | Description |
|--------|-------------|
| Sign In | CUET email-based login with admin/user toggle |
| Create Account | Registration form with OTP email verification |
| Item Listings | Browse items with filters (category, price, condition) |
| Auction Details | Live bid tracking, countdown timer, bid history |
| Auction Settings | Configure starting bid, increment, duration, buy-now |
| Admin Dashboard | Pending posts, report review, user management |
| Messaging | In-app private chat between buyers and sellers |
| Report Item | Submit complaints with reason and description |

> Screenshots available in the `/docs/screenshots/` folder or the project report PDF.

---

## 👩‍💻 Team Members

| Name | Student ID | Contribution |
|------|-----------|--------------|
| **Sajnin Akter** | 2204070 | Backend Development, Authentication Module |
| **Debirupa Dutta** | 2204071 | Database Design, Bidding Logic |
| **Laiba Tabassum** | 2204077 | Frontend Development, UI/UX |
| **Tahrima Jahan** | 2204078 | Admin Module, Testing & Documentation |

**Supervised by:**
- **Md. Shafiul Alam Forhad** — Assistant Professor, Dept. of CSE, CUET

---

## 📚 Course Information

| Field | Details |
|-------|---------|
| **Institution** | Chittagong University of Engineering & Technology (CUET) |
| **Department** | Computer Science and Engineering |
| **Program** | B.Sc. Engineering |
| **Session** | 2022–2023 |
| **Course** | Software Development with Java |
| **Course No.** | CSE-202 |
| **Submission Date** | October 09, 2025 |

---

## 🔭 Future Scope

- [ ] 🔴 **Real-time bidding** with WebSocket / Server-Sent Events
- [ ] 💳 **Payment gateway** integration (bKash, Stripe, PayPal)
- [ ] 📱 **Mobile app** with React Native or Flutter
- [ ] 🤖 **AI-based recommendations** using ML on browsing/bid history
- [ ] 🔍 **Elasticsearch** for full-text search and filtering
- [ ] 🚀 **Cloud deployment** on AWS / Google Cloud with Docker & Kubernetes
- [ ] 🔔 **Push notifications** via Firebase Cloud Messaging (FCM)
- [ ] 🏫 **SSO integration** with CUET's student portal
- [ ] 📊 **Advanced analytics dashboard** for admins

---

## 📄 License

This project was developed for academic purposes as part of a B.Sc. Engineering course at CUET. It is intended for educational use only.

---

<div align="center">

Made with ❤️ by Team Bid & Buy - CUET CSE, Batch 2022

</div>
