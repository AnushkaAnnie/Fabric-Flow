# FabricFlow — Yarn & Fabric Tracking System

A full-stack, production-ready system to track the textile manufacturing lifecycle (Yarn &rarr; Knitting &rarr; Dyeing &rarr; Compacting). Built for dual deployment (Offline Desktop via Electron + SQLite AND Cloud via React + PostgreSQL).

## 🚀 Features
- **Strict Dropdown Workflows:** All inputs pull from master data.
- **Auto-Calculations:** Total weights, costs, and process/yield loss.
- **Responsive UI:** Dark theme, tabular navigation.
- **Offline Capable:** Packaged via Electron with a local SQLite DB.
- **Cloud Ready:** Postgres Docker-compose support.

## 🛠️ Stack
- **Frontend:** React, Vite, Material UI, Zustand, Recharts, Lucide Icons.
- **Backend:** Node.js, Express, Prisma ORM, JWT, Bcrypt.
- **Desktop:** Electron.

## 💻 Running Locally (Development)

1. **Install Root Dependencies**
   ```bash
   npm install
   ```
2. **Install Backend & Frontend Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Database Setup (SQLite)**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run db:seed
   ```
4. **Start the App**
   *(From the root directory)*
   ```bash
   npm run dev
   ```
   *Frontend starts on port `5173`, Backend on `3001`.*

## 🔒 Default Login
- **Username:** `admin`
- **Password:** `admin123`

## 📦 Building for Desktop (Offline Office App)

1. Ensure the React app is built:
   ```bash
   npm run build:frontend
   ```
2. Build the Electron Windows installer:
    ```bash
    npm run electron:build
    ```
3. Run directly (without building installer):
    ```bash
    npm run app:offline
    ```

## ☁️ Deploying to Cloud

To run the backend with PostgreSQL via Docker:
```bash
docker-compose up -d
```
You will need to manually change `provider = "sqlite"` to `provider = "postgresql"` in `backend/prisma/schema.prisma` before building the Docker image if you intend to use Postgres.

For frontend, build using `cd frontend && npm run build` and deploy the `dist` folder to Vercel/Netlify. Ensure `VITE_API_URL` is set to your cloud backend URL.
