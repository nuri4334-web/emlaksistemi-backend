# Lumina Estates - Backend & Frontend System

## EN: Getting Started & Installation

This project consists of a `NestJS` backend (MongoDB Atlas) and a `Nuxt 3` frontend (TailwindCSS, Pinia). Follow the instructions below to run both applications locally.

### 1. Backend Setup

```bash
cd backend
npm install
# Set your MongoDB Atlas URI in .env if not set
npm run start:dev
```
*The backend will run on `http://localhost:3001`.*

**Testing (Optional but recommended):**
```bash
npm run test
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

**Testing Credentials:**
- Test Users exist in the database, initialized by Seeders. Check backend logs or Seed script.

---

## TR: Kurulum ve Çalıştırma

Bu proje bir `NestJS` backend (MongoDB Atlas) ve bir `Nuxt 3` frontend (TailwindCSS, Pinia) içerir. Uygulamaları yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Backend Kurulumu

```bash
cd backend
npm install
# .env dosyanızdaki MongoDB Atlas URI ayarını yapmayı unutmayın
npm run start:dev
```
*Backend `http://localhost:3001` adresinde çalışacaktır.*

**Test Etme (Opsiyonel ama önerilir):**
```bash
npm run test
```

### 2. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```
*Frontend `http://localhost:3000` adresinde çalışacaktır.*

**Test Girişleri:**
- Test kullanıcıları veritabanında Seeders tarafından otomatik oluşturulur. Detaylar için backend loglarını veya Seed script'ini inceleyebilirsiniz.