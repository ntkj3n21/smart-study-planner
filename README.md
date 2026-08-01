# Smart Study Planner

A full-stack Progressive Web Application designed to help university students organize subjects, manage academic tasks, build study schedules, maintain focus, and monitor learning progress from one workspace.

> This project was developed as part of a student scientific research project at Ho Chi Minh City Open University.

## Overview

Smart Study Planner combines academic planning and productivity tools in a single web application.

The system allows students to:

- Manage subjects and recurring class schedules.
- Organize academic tasks using a Kanban workflow.
- Automatically classify task priority based on remaining deadline time.
- Connect Pomodoro sessions to specific tasks.
- Record study time and analyze learning progress.
- View schedules, deadlines, achievements, and performance statistics.
- Install the application as a Progressive Web App.

The project follows a client-server architecture with a React frontend, an Express REST API, and a PostgreSQL database managed through Prisma ORM.

## Research Project

**Vietnamese title:** Phát triển hệ thống hỗ trợ lập kế hoạch học tập cho sinh viên

**English title:** Development of a Study Planning Support System for University Students

| Information | Details |
| --- | --- |
| Project code | 1187 |
| Institution | Ho Chi Minh City Open University |
| Faculty | Khoa Đào tạo đặc biệt |
| Project type | Student Scientific Research |
| Completion date | March 2026 |
| Project leader | Nguyễn Phan Thiên Phát |
| Supervisor | ThS. Nguyễn Văn Bảy |

### Research team

- Nguyễn Phan Thiên Phát
- Võ Châu Anh Kiệt
- Từ Ngọc Anh Khoa
- Nguyễn Quốc Bảo
- Nguyễn Trung Kiên

### Research report

The complete research report is available in Vietnamese:

[View the Smart Study Planner Research Report](docs/Smart-Study-Planner-Research-Report-2026.pdf)

> The report reflects the research scope and system design at the time of submission in March 2026. Some proposed features described in the report may differ from the current implementation in this repository.

## Research Background

The project combines several productivity and learning-support approaches:

### Kanban task management

Academic tasks move through three main states:

```text
TODO → IN_PROGRESS → DONE
```

This provides a visual workflow for monitoring the lifecycle of assignments, projects, and other academic work.

### Pomodoro technique

The integrated Pomodoro timer helps students divide study time into focused work sessions and breaks.

Completed focus sessions can be linked to a task and recorded as study sessions in the database.

### Automatic priority classification

Smart Study Planner uses a deadline-based heuristic inspired by the scheduling principles discussed in the research report.

The current implementation classifies tasks according to the remaining time before their deadline:

| Remaining time | Priority |
| --- | --- |
| 2 days or fewer | High |
| 3–7 days | Medium |
| More than 7 days | Low |
| No deadline | Low |

This is a simplified deadline-based priority heuristic. It is inspired by the idea of reducing decision effort but is not a complete implementation of the standard Weighted Shortest Job First formula.

### Automatic background updates

A scheduled background process runs every day at midnight to recalculate the priority of unfinished tasks as their deadlines approach.

## Current Features

### Authentication and account management

- User registration.
- User login and logout.
- JWT-based authentication.
- Password hashing with bcrypt.
- Protected application routes.
- Email-based password reset.
- Password change for authenticated users.
- Account deletion with related-data cleanup.

### Dashboard

- Overview of current learning activity.
- Upcoming academic tasks.
- Today's class schedule.
- Weekly task progress.
- Study-time information.
- Quick navigation to core modules.

### Subject management

- Create subjects.
- Edit subject information.
- Delete subjects.
- Assign colors and icons.
- Configure expected weekly study hours.
- Associate tasks and class schedules with subjects.

### Task management

- Create, update, and delete academic tasks.
- Add descriptions and deadlines.
- Associate tasks with subjects.
- Organize tasks using Kanban states.
- Automatically calculate priority from deadlines.
- Restrict each user to their own tasks and subjects.
- Display task priority using High, Medium, and Low labels.

### Calendar and class schedules

- Day, week, and month calendar views.
- Create recurring class schedules.
- Select one or multiple weekdays.
- Configure start time, end time, room, and color.
- Support weekly, odd-week, and even-week recurrence.
- Detect overlapping schedules before creation.
- Delete existing schedules.
- Display today's classes on the dashboard.

### Pomodoro timer

- Focus, short-break, and long-break modes.
- Configurable session durations.
- Associate a focus session with an active task.
- Persist timer state in browser storage.
- Restore an active timer after page navigation or refresh.
- Record completed focus sessions in the database.
- Track the number of completed Pomodoro sessions.

### Analytics

- Total study time.
- Completed task count.
- Scheduled class count.
- Average daily study hours.
- Weekly study-time chart.
- Subject-based task distribution.
- Six-month task completion trend.
- Recent study sessions.
- Achievement tracking.

Available achievements include:

- Task Master
- Bookworm
- Early Bird
- Seven-Day Study Streak

### Notifications

- Recently completed task notifications.
- Upcoming deadline warnings.
- Pomodoro completion activity.
- Achievement notifications.
- Browser notification preferences.

### Profile and settings

- Display account and learning statistics.
- Track recent activity.
- Manage personal goals.
- Customize profile information and avatar.
- Light and dark appearance modes.
- Primary-color customization.
- Font-size settings.
- Pomodoro duration preferences.
- Notification preferences.

### Progressive Web App

- Installable application manifest.
- Automatic service-worker updates.
- Asset caching.
- Network-first API response caching.
- Responsive interface for desktop and mobile layouts.

The current PWA configuration improves installability and cached access. It should not be considered a complete offline-first synchronization system.

## System Architecture

```mermaid
flowchart LR
    User[Student] --> Client[React PWA Client]

    Client -->|REST API + JWT| Server[Node.js and Express API]

    Server --> Auth[Authentication and Validation]
    Server --> Modules[Subjects, Tasks, Schedules, Sessions and Analytics]
    Server --> Prisma[Prisma ORM]

    Prisma --> Database[(PostgreSQL)]

    Cron[node-cron Background Process] --> Server
    Server --> Email[Resend Email API]
```

### Architecture layers

1. **Presentation layer**  
   React, React Router, Tailwind CSS, Recharts, and Progressive Web App components.

2. **Application layer**  
   Express controllers, middleware, validation, authentication, and business logic.

3. **Data access layer**  
   Prisma ORM and PostgreSQL.

4. **Background processing**  
   A scheduled Cron Job recalculates task priorities every day.

## Technology Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide React
- Vite PWA Plugin
- TypeScript and JavaScript

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JSON Web Token
- bcrypt
- express-validator
- Helmet
- node-cron
- Resend Email API

## Data Model

The current database contains five main entities:

### User

Stores account information, authentication data, and password-reset tokens.

### Subject

Represents a course or subject owned by a user.

A subject can contain:

- Academic tasks.
- Class schedules.
- Display color.
- Icon.
- Expected weekly study hours.

### Task

Represents an assignment or academic activity.

A task contains:

- Title and description.
- Optional deadline.
- Priority.
- Kanban status.
- Associated subject.
- Owner information.

### StudySession

Records the number of minutes spent in a completed focus session and links the session to a user and task.

### ClassSchedule

Stores recurring class information, including:

- Weekday.
- Start and end time.
- Room.
- Recurrence pattern.
- Display color.
- Associated subject.

## API Modules

The backend exposes REST endpoints under:

```text
/api/v1
```

Main modules:

```text
/api/v1/auth
/api/v1/users
/api/v1/subjects
/api/v1/tasks
/api/v1/schedule
/api/v1/studySession
/api/v1/analytics
```

A health-check endpoint is available at:

```text
GET /api/v1/health
```

Most application endpoints require a valid JWT access token.

## Project Structure

```text
smart-study-planner/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── styles/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── cron/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── validations/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── docs/
│   └── Smart-Study-Planner-Research-Report-2026.pdf
├── .gitignore
└── README.md
```

## Getting Started

### Requirements

Install the following tools before running the project:

- A current LTS version of Node.js.
- npm.
- PostgreSQL.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/ntkj3n21/smart-study-planner.git
cd smart-study-planner
```

### 2. Configure the backend

Move into the backend directory:

```bash
cd server
npm install
```

Create a `.env` file from `.env.example`.

macOS or Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the environment variables:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173

RESEND_API_KEY=re_your_api_key
EMAIL_FROM=Study Planner <noreply@your-verified-domain.com>
```

`RESEND_API_KEY` and `EMAIL_FROM` are required for email-based password recovery.

Generate the Prisma client:

```bash
npm run db:generate
```

Apply the existing database migration:

```bash
npm run db:migrate
```

Start the backend development server:

```bash
npm run dev
```

The backend runs by default at:

```text
http://localhost:5000
```

### 3. Configure the frontend

Open another terminal and move into the frontend directory:

```bash
cd client
npm install
```

Create a `.env` file:

macOS or Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the API base URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend development server:

```bash
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

## Available Scripts

### Client

```bash
npm run dev
```

Starts the frontend development server.

```bash
npm run build
```

Creates a production frontend build.

```bash
npm run preview
```

Previews the production frontend build.

### Server

```bash
npm run dev
```

Starts the backend using Nodemon.

```bash
npm start
```

Starts the backend using Node.js.

```bash
npm run db:generate
```

Generates the Prisma client.

```bash
npm run db:migrate
```

Applies committed Prisma migrations.

```bash
npm run db:push
```

Pushes the Prisma schema directly to the configured database.

```bash
npm run db:studio
```

Opens Prisma Studio.

## Security Measures

The current backend includes:

- Password hashing using bcrypt.
- JWT-based authentication.
- Request validation using express-validator.
- Protected API routes.
- Ownership checks for user data.
- HTTP security headers using Helmet.
- Hashed and time-limited password-reset tokens.
- Generic password-reset responses to reduce account enumeration.
- Cascading deletion of related user data.

## Current Limitations

- The automatic priority algorithm only considers the remaining deadline time.
- It is not a complete implementation of standard WSJF.
- The repository does not currently contain an automated test suite.
- The frontend does not currently provide a lint script.
- The frontend codebase contains both JavaScript and TypeScript.
- Full offline creation and synchronization of data are not guaranteed.
- Password recovery requires a configured external email provider.
- Some features proposed in the research report may not be present in the current source code.

## Future Development

Potential improvements include:

- Add frontend and backend automated tests.
- Add ESLint and consistent formatting rules.
- Increase TypeScript coverage.
- Introduce runtime response validation.
- Add continuous integration.
- Improve offline data synchronization.
- Extend priority calculation with task importance and estimated workload.
- Add more detailed experiment and evaluation data.
- Improve accessibility and mobile interaction.
- Add API documentation using OpenAPI or Swagger.

## Attribution

The frontend interface was developed from an earlier Figma design prototype.

Third-party design and image attributions are documented in:

[client/ATTRIBUTIONS.md](client/ATTRIBUTIONS.md)

## Project Status

Smart Study Planner is an academic research prototype.

The repository contains the implemented web application and its associated scientific research report. The software may continue to evolve independently from the report submitted in March 2026.