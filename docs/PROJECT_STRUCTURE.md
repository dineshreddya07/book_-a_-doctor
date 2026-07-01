# Project Structure – Book a Doctor

```
book-a-doctor/
├── .gitignore
├── README.md
├── docs/
│   └── api/                    # API documentation (Step 10)
├── backend/
│   ├── config/                 # Database, env, app configuration
│   ├── controllers/            # Route handlers (MVC)
│   ├── middleware/             # Auth, validation, error handling, upload
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express route definitions
│   ├── services/               # Business logic (AI, email, notifications)
│   ├── utils/                  # Helpers, constants, API responses
│   ├── validators/             # Express-validator schemas
│   └── uploads/
│       ├── profiles/           # User/doctor profile photos
│       ├── reports/            # Patient medical reports
│       ├── qualifications/     # Doctor qualification documents
│       └── licenses/           # Doctor medical licenses
└── frontend/
    ├── public/                 # Static assets
    └── src/
        ├── assets/
        │   ├── images/
        │   └── styles/
        ├── components/
        │   ├── common/         # Navbar, Footer, Cards, Loaders, Toasts
        │   ├── auth/           # Login, Register, Password forms
        │   ├── patient/        # Patient-specific UI components
        │   ├── doctor/         # Doctor-specific UI components
        │   ├── admin/          # Admin-specific UI components
        │   └── ai/             # AI assistant UI components
        ├── context/            # Auth, Theme (dark mode), Notifications
        ├── hooks/              # Custom React hooks
        ├── layouts/            # Main, Dashboard, Auth layouts
        ├── pages/
        │   ├── auth/           # Login, Register, Forgot/Reset Password
        │   ├── patient/        # Patient dashboard, appointments, reports
        │   ├── doctor/         # Doctor dashboard, availability, patients
        │   ├── admin/          # Admin dashboard, user management
        │   └── public/         # Home, Browse Doctors, 404
        ├── services/           # Axios API service modules
        └── utils/              # Formatters, validators, constants
```

## Database Collections (planned)

- Users
- Doctors
- Appointments
- Reports
- Notifications
- Chats
- Messages
- AdminLogs
- Reviews

## Deployment Targets

| Component  | Platform       |
|-----------|----------------|
| Frontend  | Vercel         |
| Backend   | Render         |
| Database  | MongoDB Atlas  |
