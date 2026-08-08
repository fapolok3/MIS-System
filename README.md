# MIS Management System

An Enterprise Infrastructure & Device Management System built with **React**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## 🚀 Key Features

- **Dashboard Analytics**:
  - Live device distribution & status summary cards.
  - Interactive Year selector with 12-month trend charts (Monthly Solved Ratio Line Chart & Service Tickets Bar Chart).
  - High Priority & Recent Tickets table with **10 items per page pagination**.
- **Device MIS Management**:
  - Hierarchical Device Tree organized by categories & branches.
  - CRUD operations for devices with status tracking (`LIVE`, `DOWN`, `MAINTENANCE`).
  - Excel bulk import and export capabilities.
- **Service Ticket System**:
  - Comprehensive ticket tracking with SLA management and resolution metrics.
  - Add, edit, resolve, and delete tickets.
- **Purchase Orders (PO)**:
  - Inventory acquisition tracking with vendors, prices, quantities, and status.
- **SIM Card Inventory**:
  - Voice and Data SIM tracking across locations and operators.
- **Supabase Cloud Integration**:
  - All devices, tickets, POs, SIM items, category groups, and user credentials persist directly to Supabase PostgreSQL database.
- **Authentication**:
  - Secure login verified against the `user_credentials` table in Supabase.

---

## 🗄️ Supabase Setup & Database Schema

To connect your Supabase database:

1. Open your **Supabase Dashboard** for project `pgzlfirdycocxzxekhbo` (or your custom project).
2. Go to the **SQL Editor**.
3. Run the SQL statements provided in the [`supabase_schema.sql`](./supabase_schema.sql) file located at the root of this project.

### Environment Variables

Configure `.env` or environment settings with your Supabase credentials:

```env
VITE_SUPABASE_URL="https://pgzlfirdycocxzxekhbo.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## 🛠️ Local Development

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript linter
npm run lint

# Build for production
npm run build
```

---

## 📁 Project Structure

```text
├── supabase_schema.sql     # Database schema & setup script for Supabase
├── src/
│   ├── components/         # React UI components (Dashboard, Sidebar, Header, Modals)
│   ├── data/               # Initial state fallback data
│   ├── lib/                # Supabase client & API integration methods
│   ├── types.ts            # TypeScript definitions
│   ├── App.tsx             # Main application orchestrator
│   └── main.tsx            # Entry point
├── package.json
└── README.md
```
