# Bid & Buy — CUET Campus Auction Platform

A full-stack campus marketplace built with Spring Boot + React.

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0

### 1. Database Setup
```sql
CREATE DATABASE IF NOT EXISTS BidBuy;
USE BidBuy;
SOURCE bid&buy.sql;
```

### 2. Configure Backend
Edit `java-backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 3. Create MySQL User (if needed)
```sql
CREATE USER 'Bid-N-Buy'@'localhost' IDENTIFIED BY 'Bid-N-Buy-2025';
GRANT ALL PRIVILEGES ON BidBuy.* TO 'Bid-N-Buy'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Run Backend
```powershell
cd java-backend
.\mvnw.cmd spring-boot:run
```
Backend runs at: http://localhost:8080

### 5. Run Frontend
```powershell
cd java-frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

## 🔐 Default Admin
- **Email:** u2204077@student.cuet.ac.bd
- **Password:** 12345678
- **Name:** Laiba Tabassum

## 📋 Features
- CUET email-verified registration with OTP
- Item listings with image upload
- Live auction with real-time bidding
- In-app messaging
- Admin moderation panel
- Dark mode support

## 🏗️ Tech Stack
- **Backend:** Java 17, Spring Boot 3.5, MySQL 8, JWT
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
