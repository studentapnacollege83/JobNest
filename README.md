# JobNest – Job & Internship Portal

A full-stack job and internship portal built with Node.js, Express, EJS,
Tailwind CSS, and MongoDB.

## Features

- User registration and login
- Role-based job seeker and employer dashboards
- Browse, search, filter, and sort jobs
- Employer job posting, editing, and closing
- Job applications and duplicate-application protection
- Resume uploads and applicant resume viewing
- Application status updates and hiring notifications
- Employer dashboard statistics
- Session-based authentication and branded error pages

## Tech stack

- Node.js and Express
- EJS
- Tailwind CSS v4
- MongoDB and Mongoose
- Express Session
- Multer
- Resend

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`, then replace its placeholder values. Never
   commit `.env`.

   ```powershell
   Copy-Item .env.example .env
   ```

   Required variables:

   - `MONGODB_URI`: a MongoDB connection string beginning with `mongodb+srv://`
     or `mongodb://`.
   - `SESSION_SECRET`: a long, random secret for signing sessions.
   - `RESEND_API_KEY`: required when email notifications are enabled.

3. Build CSS and start the application:

   ```bash
   npm run build:css
   npm start
   ```

## Deploying to Render

Render dashboard variables are separate from the local `.env` file. In the
Render service dashboard, open **Environment** and set these exact names:

- `MONGODB_URI`
- `SESSION_SECRET`
- `RESEND_API_KEY` (if using email notifications)
- `NODE_ENV=production`

Do not use placeholder text or surround values with quotes in Render. Do not
put credentials in this repository.

Use these service settings:

- Build command: `npm install --include=dev && npm run build:css`
- Start command: `npm start`

In MongoDB Atlas, configure Network Access so the Render service can reach the
cluster, and create a database user with the permissions required by the app.
The app validates the URI format at startup; an actual Atlas connection can only
be verified when the deployed service has network access.
