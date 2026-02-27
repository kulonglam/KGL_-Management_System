# Karibu Groceries LTD - Backend API

Node.js/Express/MongoDB backend for the Karibu Groceries wholesale produce distribution system.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)

### Installation

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment variables:
   Edit `.env` file and update:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/karibu_groceries
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

3. Start MongoDB:

```bash
# Make sure MongoDB is running on your system
mongod
```

4. Seed the database with sample data:

```bash
node seedData.js
```

5. Start the server:

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Procurement (Manager only)

- `GET /api/procurement` - Get all procurement records
- `POST /api/procurement` - Create new procurement
- `GET /api/procurement/:id` - Get procurement by ID
- `PUT /api/procurement/:id` - Update procurement
- `DELETE /api/procurement/:id` - Delete procurement

### Sales

- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale (Manager/Sales Agent)
- `GET /api/sales/aggregation` - Get sales aggregation (Director only)
- `DELETE /api/sales/:id` - Delete sale (Manager only)

### Credit Sales

- `GET /api/credit-sales` - Get all credit sales
- `POST /api/credit-sales` - Create new credit sale (Manager/Sales Agent)
- `PUT /api/credit-sales/:id/payment` - Update payment status (Manager only)
- `DELETE /api/credit-sales/:id` - Delete credit sale (Manager only)

### Inventory

- `GET /api/inventory` - Get inventory
- `POST /api/inventory/check-stock` - Check stock availability

### Notifications (Manager)

- `GET /api/notifications` - Get stock notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Operations

- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe

## Sample User Credentials

All users have password: `password123`

| Username | Role        | Branch   |
| -------- | ----------- | -------- |
| orban    | Director    | -        |
| manager1 | Manager     | Branch 1 |
| manager2 | Manager     | Branch 2 |
| agent1a  | Sales Agent | Branch 1 |
| agent1b  | Sales Agent | Branch 1 |
| agent2a  | Sales Agent | Branch 2 |
| agent2b  | Sales Agent | Branch 2 |

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
