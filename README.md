# AgileAllView

Analytics dashboard for Azure DevOps squad efficiency tracking.

## Features

- Azure DevOps integration via REST API
- Real-time metrics calculation (Lead Time, Cycle Time, Throughput)
- Sprint planning analysis (Planned vs Realized)
- Capacity tracking by activity and individual
- Team composition simulator
- State-based time tracking

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Supabase (PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 20+
- Azure DevOps organization with Personal Access Token
- Supabase account

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

### First Time Setup

1. Sign in with your username and Azure DevOps Personal Access Token
2. Add a new team with:
   - Team name
   - Organization name
   - Project name
   - Team ID (from Azure DevOps)
   - Area Path

### Syncing Data

1. Open the team dashboard
2. Click "Sync Data" to import work items, iterations, and capacity from Azure DevOps
3. The system will process historical revisions to calculate metrics

### Dashboard Views

- **Metrics**: View lead time, cycle time, throughput, and time in states
- **Capacity**: See sprint capacity by activity and days off
- **Individual**: Track individual team member delivery
- **Simulator**: Simulate team composition and estimated capacity

## Architecture

### Data Flow

```
Azure DevOps API
    ↓
Sync Process (lib/azure/sync.ts)
    ↓
Supabase Database
    ↓
Analytics Engine (lib/analytics/metrics.ts)
    ↓
Dashboard Components
```

### Database Schema

- **teams**: Team configurations
- **work_items**: PBIs, tasks, and bugs
- **revisions**: Historical state changes
- **iterations**: Sprint/iteration data
- **capacity**: Team member capacity by activity
- **metrics**: Calculated metrics per work item

## Security

- Personal Access Tokens are stored in session storage only
- Never persisted to database or local storage
- Automatically cleared on logout or browser close

## Development

Run the build:
```bash
npm run build
```

## License

MIT
