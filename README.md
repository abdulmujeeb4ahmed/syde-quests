# SydeQuests 🎯

A guest-mode MVP for discovering and completing local quests in your city. Built with Next.js, TailwindCSS, and localStorage for persistence.

## Features

- **No Authentication Required**: All progress is stored locally on your device
- **Geolocated Recommendations**: Find quests near your current location
- **Quest of the Day**: Daily featured quests that rotate automatically
- **Gamification**: Earn points, badges, and track your progress
- **Smart Filtering**: Filter by category, difficulty, duration, and distance
- **Quest Completion**: Rate and review your quest experiences
- **Progress Tracking**: View your stats, badges, and quest history

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: TailwindCSS with custom adventure theme
- **Storage**: localStorage for user data persistence
- **Testing**: Jest for unit tests
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd syde-quests
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
syde-quests/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── quests/[id]/      # Quest detail pages
│   ├── search/           # Search page
│   └── progress/         # Progress page
├── components/           # React components
├── lib/                  # Utility functions
│   ├── storage.ts        # localStorage utilities
│   ├── geo.ts           # Geolocation helpers
│   ├── recommend.ts     # Recommendation engine
│   └── qod.ts           # Quest of the Day logic
├── data/                 # Sample quest data
└── __tests__/           # Unit tests
```

## Key Components

### Storage System (`lib/storage.ts`)
- Device ID generation and persistence
- User preferences management
- Quest completion tracking
- Badge and points system

### Geolocation (`lib/geo.ts`)
- Distance calculations using Haversine formula
- Current location detection
- Nearby quest filtering

### Recommendation Engine (`lib/recommend.ts`)
- Personalized quest suggestions
- Interest-based matching
- Proximity and novelty scoring

### Quest of the Day (`lib/qod.ts`)
- Deterministic daily quest selection
- Rotation logic to avoid repeats
- Device-specific randomization

## Data Structure

### User State
```typescript
{
  preferences: {
    homeLocation: { lat: number, lng: number, address: string } | null,
    interests: string[],
    distanceKm: number,
    allowNotifications: boolean
  },
  completions: {
    [questId]: {
      completedAt: string,
      rating: number,
      notes: string
    }
  },
  badges: string[],
  points: number,
  lastSeenQuestOfDay: string | null
}
```

### Quest Data
```typescript
{
  id: string,
  title: string,
  description: string,
  category: string,
  duration_min: number,
  difficulty: string,
  lat: number,
  lng: number,
  city: string,
  tags: string[],
  cover_url?: string,
  created_at: string
}
```

## API Routes

- `GET /api/quests` - Get all quests with optional filtering
- `GET /api/quests/[id]` - Get specific quest details

### Query Parameters for `/api/quests`
- `category` - Filter by category
- `difficulty` - Filter by difficulty
- `maxDuration` - Filter by maximum duration
- `lat`, `lng` - User location for distance filtering
- `maxDistance` - Maximum distance in kilometers

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Customization

### Adding New Quests

1. Edit `data/quests.seed.json`
2. Add new quest objects with required fields
3. Restart the development server

### Styling

The app uses a custom adventure theme defined in `app/globals.css`:
- `--sq-bg`: Dark background (#0B1220)
- `--sq-primary`: Teal accent (#00D1B2)
- `--sq-accent`: Amber accent (#F59E0B)
- `--sq-muted`: Muted text (#94A3B8)
- `--sq-card`: Card background (#0F172A)

### Adding New Categories

1. Update the `CATEGORIES` array in `components/FiltersBar.tsx`
2. Add corresponding emoji mapping in quest components
3. Update the sample data with new categories

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- AWS Amplify
- Railway
- Any platform supporting Node.js

## Browser Support

- Modern browsers with localStorage support
- Geolocation API support (optional)
- ES6+ features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Happy Questing! 🎯🚀**