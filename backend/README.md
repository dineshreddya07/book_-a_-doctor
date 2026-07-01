# Backend – Book a Doctor API

Express.js REST API with MongoDB, JWT auth, file uploads, and AI integration.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (development) |
| `npm start` | Start production server |
| `npm test` | Run backend integration tests |

## Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:3000) |
| `GEMINI_API_KEY` | Step 9 | Google Gemini API key for AI features |

## API Endpoints (Step 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API welcome message |
| GET | `/api/health` | Health check |

## Architecture

- **MVC** – Models, Controllers, Routes
- **Middleware** – Auth, validation, error handling, file uploads
- **Services** – Business logic (AI, notifications – later steps)
- **Validators** – Express-validator schemas (later steps)

## Security (configured)

- Helmet (HTTP headers)
- CORS (origin whitelist)
- Rate limiting (100 req/15min in production)
- bcrypt (password hashing – Step 5)
- JWT (authentication – Step 5)
- Input validation (express-validator)
- Multer file type/size restrictions

## Project Structure

```
backend/
├── config/          env.js, db.js
├── controllers/     Route handlers
├── middleware/      Auth, upload, validate, errors
├── models/          Mongoose schemas (Step 4)
├── routes/          Express routers
├── services/        Business logic
├── utils/           Helpers, constants
├── validators/      Request validation schemas
├── uploads/         Uploaded files
├── app.js           Express app configuration
└── server.js        Entry point
```
