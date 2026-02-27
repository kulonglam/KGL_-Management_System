# Karibu Groceries LTD - Frontend

Vue.js 3 + Bootstrap 5 frontend for the Karibu Groceries wholesale produce distribution system.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Backend API running on `http://localhost:5000`

### Installation

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

3. Build for production:

```bash
npm run build
```

## Features

### Role-Based Access Control

#### Director (Mr. Orban)

- View aggregated sales across all branches
- See total revenue, cash sales, and credit sales
- View branch-wise performance breakdown

#### Manager

- Full access to branch operations
- Record procurement
- Record sales (cash and credit)
- View inventory with low stock alerts
- Branch-specific dashboard

#### Sales Agent

- Record sales transactions
- Record credit sales
- View inventory
- Personal sales dashboard

## Login Credentials

All users have password: `password123`

- **Director**: orban
- **Manager Branch 1**: manager1
- **Manager Branch 2**: manager2
- **Sales Agent Branch 1**: agent1a, agent1b
- **Sales Agent Branch 2**: agent2a, agent2b

## Business Rules Implemented

1. ✅ Only products in stock can be sold
2. ✅ Real-time inventory tracking
3. ✅ Low stock alerts (< 500 kg)
4. ✅ Minimum procurement: 1000 kg
5. ✅ Phone number validation (Uganda format)
6. ✅ National ID validation (14 characters)
7. ✅ Sales agents cannot record procurement
8. ✅ Directors see only aggregated data
9. ✅ Auto-calculation of sale amounts

## Technology Stack

- **Vue.js 3** - Progressive JavaScript framework
- **Vue Router** - Official router
- **Bootstrap 5** - CSS framework
- **Bootstrap Icons** - Icon library
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # Styles and images
│   ├── components/     # Reusable components
│   ├── views/          # Page components
│   ├── router/         # Vue Router configuration
│   ├── services/       # API services
│   ├── App.vue         # Root component
│   └── main.js         # Application entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`.

JWT tokens are stored in localStorage and automatically attached to API requests.

## Development Notes

- The app uses Bootstrap 5 for styling
- Vue Router handles navigation and route guards
- Axios interceptors add JWT tokens to requests
- Form validation matches backend requirements

Here’s a concise evaluation checklist tailored to your project, aligned with the criteria you provided.

Functionality

Role access works: Director sees aggregation only; Manager can procure/sell/manage prices/users; Sales Agent can sell only.
Inventory rules enforced: only in-stock sales; tonnage reduction on sales/credit.
Credit flow works: trusted buyers required; repayment updates balances correctly.
Branch rules enforced: exactly 1 manager + max 2 attendants per branch.
Dates/time & validations match business rules (NIN/phone/amount thresholds).
Code Quality

Clear separation: controllers/routes/models and Vue views/services.
Validation centralized in Mongoose + front-end form constraints.
Reusable services (api.js) and clean component structure.
Minimal side effects; errors handled; consistent formatting.
Design & UX

Clean sidebar structure; fixed header and sidebar.
Forms are focused and uncluttered (records moved to separate pages).
Clear alerts and feedback messages.
Charts are distinct and readable; Sales Agent view stays minimal.
Problem-Solving

Missing requirement gaps closed (manager limit, name validation, out‑of‑stock alert).
Errors resolved with proper backend fixes (credit repayment validation).
UI adjusted based on real workflow (record pages separated, buyer handling, confirmation modals).
