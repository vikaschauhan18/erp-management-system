# ERP Management System

**Author:** Vikas Chauhan  
**Project Type:** Full-Stack Web Application  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

An ERP-style web application for managing product inventory, customers, suppliers, sales orders, purchase orders, goods receipt notes (GRNs), and invoices from one responsive dashboard. This repository is a portfolio/learning project; see the implementation notes below for current scope and limitations.

## Features implemented

### Authentication and access
- Register and sign in using email and password.
- Passwords are hashed with `bcryptjs`.
- JWT-protected API routes with an eight-hour token expiry.
- Roles supported by the API: `Admin`, `Sales`, `Purchase`, and `Inventory`.
- The first account registered through the public registration endpoint is assigned the Admin role; subsequent public registrations receive the Sales role.
- Admin-only endpoint for listing users.

### Business modules
- **Dashboard:** counts for products, customers, suppliers, sales orders, purchase orders, and invoices; low-stock count; total revenue from invoices marked Paid.
- **Products:** create, view, search, edit, and delete products; SKU, category, price, stock, and reorder level fields.
- **Customers and suppliers:** create, view, search, edit, and delete contact records.
- **Sales orders:** create orders for a customer, view order details, and update order status.
- **Purchase orders:** create orders for a supplier, view order details, and update order status.
- **Goods receipt notes (GRN):** receive items against a purchase order, create a GRN record, mark the purchase order Received, and increase product stock.
- **Invoices:** generate an invoice from a sales order and change its payment status to Unpaid, Paid, or Overdue.
- **Interface:** responsive React layout, navigation, forms, tables, search, status labels, and basic error messages.

## Technologies

| Area | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router |
| Styling and icons | CSS, Lucide React |
| Dashboard visualizations | Recharts (dependency included; current dashboard primarily displays metric cards) |
| HTTP requests | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Request validation | express-validator and Mongoose schema validation |
| Development | npm, Nodemon |

## Project structure

```text
erp-management-system/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api.js           # Axios client and JWT header
│       ├── App.jsx          # Login, dashboard and ERP module screens
│       ├── main.jsx         # React entry point
│       └── styles.css       # Responsive UI styles
├── server/                 # Express API
│   └── src/
│       ├── index.js         # API routes and server setup
│       ├── middleware.js    # Authentication and error middleware
│       ├── models.js        # Mongoose data models
│       └── seed.js           # Demo data setup
├── .gitignore
└── README.md
```

## Requirements

- Node.js 20 or later recommended
- npm
- MongoDB running locally or a MongoDB Atlas connection string

## Run locally

### 1. Start the backend

```bash
cd server
```

Copy `.env.example` to `.env` and set a strong `JWT_SECRET` and your MongoDB connection string in `MONGO_URI`. Set `CLIENT_URL=http://localhost:5173` for local development.

Then run:

```bash
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000` by default. Health check: `http://localhost:5000/api/health`.

### 2. Start the frontend

Open a second terminal from the repository root:

```bash
cd client
```

Copy `.env.example` to `.env` if you need to change the API URL. The default is `http://localhost:5000/api`.

Then run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

### Demo login

After `npm run seed` completes:

- **Email:** `admin@erp.local`
- **Password:** `Admin123!`

This is a public demo credential for local development only. Do not use it for a real deployment. Change/remove the demo account before using real business data.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/auth/me` | Get the current user |
| GET | `/api/users` | List users (Admin only) |
| GET, POST, PUT, DELETE | `/api/products` | Product management |
| GET, POST, PUT, DELETE | `/api/customers` | Customer management |
| GET, POST, PUT, DELETE | `/api/suppliers` | Supplier management |
| GET, POST, PUT | `/api/sales-orders` | Sales orders |
| GET, POST, PUT | `/api/purchase-orders` | Purchase orders |
| GET, POST | `/api/grn` | Goods receipt notes |
| GET, POST | `/api/invoices` | Invoices |
| PATCH | `/api/invoices/:id/status` | Update invoice payment status |
| GET | `/api/dashboard` | Dashboard metrics |

Except for health check and authentication endpoints, API routes require an `Authorization: Bearer <token>` header. Role permissions are enforced by backend middleware on selected operations.

## GitHub upload

1. Create a new empty repository on GitHub.
2. From this project's root folder, run:

```bash
git init
git add .
git commit -m "Add ERP Management System"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/erp-management-system.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Never commit `.env` files, credentials, database URLs, or production secrets.

## Current scope and limitations

- This code package has not been verified through a full local end-to-end test or production deployment. Install dependencies and test each workflow before presenting it as production-ready.
- The current interface creates a one-product line per order; the API data model supports multiple line items.
- The current GRN screen receives the items on the selected purchase order in one action; it does not yet provide a per-item partial-receipt editor.
- PDF invoice export, automated email alerts, comprehensive automated tests, audit logs, and advanced accounting/tax workflows are not implemented in this version.
- Before production use, add rate limiting, stronger session/token handling, detailed permission tests, transaction-safe stock updates, audit logs, backups, automated tests, and business-specific accounting rules.

## Author

**Vikas Chauhan**

## 🚀 Live Demo

**ERP Management System**

[🌐 Open Live Website](https://erp-management-frontend.onrender.com)

