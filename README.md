# Fantasy Leagues MVP

A Next.js application for managing fantasy football tournament brackets and match scoring.

## Local Setup

### Prerequisites
- Node.js 20+
- npm

### Installation

1. **Clone the repository and install dependencies:**
```bash
npm install
```

2. **Set up the database:**
```bash
npm run db:push
npm run db:seed
```

This creates a SQLite database (`dev.db`) with test data.

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Database Commands

- `npm run db:seed` - Populate the database with test data
- `npm run db:reset` - Reset database to initial state (deletes all data)

## Project Structure

```
├── app/                 # Next.js app directory (pages, layouts)
├── components/          # React components
│   └── ui/             # Base UI components
├── lib/                 # Utilities and services
│   └── db.ts           # Prisma client
├── prisma/             # Database schema and migrations
│   ├── schema.prisma   # Data model
│   └── seed.ts         # Test data seed script
├── types/              # TypeScript type definitions
└── public/             # Static assets
```

## Features

- **Admin authentication** for tournament management
- **FPL integration** to import league managers
- **Tournament scheduling** with multiple rounds and matches
- **Match scoring** with member breakdowns
- **Public tournament display** with bracket progression

## Documentation

- [User Stories Specification](file:///c:/Users/akhou/OneDrive/Desktop/IT/my%20FULL-STACK%20projects/fpltournament/USER_STORIES.md) - Complete agile user stories, acceptance criteria, and business rules across all 12 epics.

## Environment Variables

See `.env.example` for all required variables. For development, the `.env` file is pre-configured.

## Deployment

Production deployment uses Turso for the database. See `.env.example` for production setup.
