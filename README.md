# Hospital Intelligence Platform

**MedIntel AI** is a full-stack "Hospital Operating System" that unifies patient monitoring, hospital operations, and risk intelligence into a single real-time platform. It transforms fragmented hospital data into actionable insights for doctors, nurses, and administrators.

## Key Features

### 1. Unified Command Center
- **Real-time Dashboard**: Live view of total patients, critical cases, bed occupancy, and staff availability.
- **Operations Center**: Interactive heatmap for Bed Management and a live Staff Directory.
- **Admin Panel**: System-wide configuration and user management.

### 2. Clinical Patient Suite
- **Live Vitals**: Historical charts for Heart Rate, Blood Pressure, SpO2, and Temperature.
- **Medication Management**: Digital prescription and administration tracking.
- **Clinical Notes**: Timeline of patient history and doctor notes.
- **Admit/Discharge**: Full patient lifecycle management.

### 3. AI & Risk Intelligence
- **Early Warning Scores**: AI-driven risk scoring to identify deteriorating patients.
- **Context-Aware AI Chat**: Integrated assistant that answers clinical questions based on specific patient data.
- **Simulation Engine**: Generates realistic, varying vital signs for all patients to simulate a real hospital environment.

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Running on default port `27017`)

### 1. Install Dependencies
Open a terminal in the project root and run:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Seed the Database
Populate the system with realistic demo data (Patients, Staff, Departments):

```bash
cd server
node seed.js
```
*You should see a success message indicating data has been seeded.*

### 3. Start the Application
You can use the provided batch script for convenience:

```bash
# From project root
./run_project.bat
```

Or run frontend and backend manually in separate terminals:

**Terminal 1 (Backend):**
```bash
cd server
node index.js
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

---

## 🔑 Login Credentials

The system comes pre-configured with an Administrator account:

*   **Email**: `admin@hospital.com`
*   **Password**: `admin123`

---

## Tech Stack

*   **Frontend**: React, Vite, TailwindCSS, Recharts, Lucide Icons
*   **Backend**: Python, Node.js, Express, Socket.IO (Real-time updates)
*   **Database**: MongoDB
*   **AI/Simulation**: Custom algorithms for vital sign generation and risk scoring

---

## Usage Guide

1.  **Dashboard**: Monitor the "Simulation Engine" updates every 5 seconds.
2.  **Patients**: Click "Admit Patient" to register a new case, or click an existing patient to view their charts.
3.  **Operations**: Use the Bed Map to find free space in ICU/ER.
4.  **Admin Panel**: Go to `/admin` to view system stats and manage staff.

---

*MedIntel AI v1.0 - Built for the Future of Healthcare.*
