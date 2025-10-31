# Bar & Restaurant Management System

A comprehensive web-based system for managing bar and restaurant operations end-to-end, including inventory tracking, kitchen orders, POS integration, staff management, and analytics.

## Project Overview

This is a full-stack application built to streamline bar and restaurant operations through real-time tracking of inventory, kitchen orders, bar sales, staff schedules, and comprehensive reporting.

**Technology Stack:**
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Express.js + Node.js + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + JWT
- **Real-time:** Supabase Realtime subscriptions
- **Styling:** Tailwind CSS

## Project Structure

```
Bar/
├── frontend/                   # React SPA + PWA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── context/           # Context API (Auth)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                # PWA manifest
│   └── package.json
│
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, RBAC
│   │   └── server.ts
│   ├── database/
│   │   └── migrations/        # Supabase SQL
│   └── package.json
│
├── shared/
│   └── types.ts               # TypeScript interfaces
│
└── README.md
```

## Core Modules

### 1. Dashboard
Real-time overview with sales, inventory status, active staff, and alerts

### 2. Inventory Management
Track items, stock levels, low stock alerts, purchase orders

### 3. Bar Management
Drink recipes, sales tracking, promotions, happy hours, tips

### 4. Kitchen Management
Digital order tickets, kitchen queue, prep status tracking

### 5. Staff Management
Profiles, scheduling, attendance, clock in/out, performance metrics

### 6. Reports & Analytics
Sales, inventory usage, staff performance, profit analysis

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with Supabase credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

- `/api/auth/*` - Authentication
- `/api/inventory/*` - Inventory management
- `/api/bar/*` - Bar sales & recipes
- `/api/kitchen/*` - Kitchen orders
- `/api/staff/*` - Staff management
- `/api/dashboard/*` - Dashboard data
- `/api/reports/*` - Analytics
- `/api/purchase-orders/*` - Supplier orders
- `/api/suppliers/*` - Supplier management

## Role-Based Access

- **Manager:** Full access
- **Bartender:** Bar sales, recipes, view inventory
- **Chef:** Kitchen orders, inventory usage
- **Waiter:** Create orders, view status
- **Support:** Limited view access

## Features

✅ Real-time inventory tracking
✅ Kitchen display system
✅ Role-based access control
✅ Sales tracking & analytics
✅ Staff scheduling & attendance
✅ POS integration ready
✅ Promotions & happy hours
✅ PWA support
✅ Mobile responsive

## Development

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

Both run on localhost with hot reload enabled.

## Deployment

- Frontend: Vercel
- Backend: Railway or Render
- Database: Supabase (managed)