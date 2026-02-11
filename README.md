# RoleList

Track your job applications with ease. RoleList helps you stay organized while hunting for your next opportunity.

## Features
- Single codebase for frontend and backend
- SQLite database with better-sqlite3
- Light mode interface
- Role tracking with status (todo, applied, hidden)
- Timestamps with relative time display (using dayjs)
- Search functionality

## Structure
- `src/app/` - Next.js app router pages
- `src/app/api/` - API routes (backend)
- `src/components/` - React components
- `src/lib/` - Database utilities
- `data/` - SQLite database

## Run

```bash
npm install
npm run build
npm run start
```

Or use PM2:
```bash
pm2 start ecosystem.config.js
```

## Port
- Default: 3000
- Both frontend and API served from same port

## API Endpoints
- `GET /api/jobs` - List all roles
- `POST /api/jobs` - Create new role
- `PATCH /api/jobs/:id` - Update role
- `DELETE /api/jobs/:id` - Delete role
