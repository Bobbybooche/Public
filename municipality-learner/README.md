# Municipality Learner

A full-stack web application for learning European municipalities using spaced repetition. Built with React, Node.js/Express, and PostgreSQL.

## Features

- **Spaced Repetition (SM-2)**: Intelligent scheduling that prioritizes municipalities you struggle with
- **Two Exercise Types**:
  - Text to Country: See a municipality name, type the country
  - Audio to Text+Country: Hear pronunciation, type both the spelling and country
- **Progress Tracking**: Daily streak counter, session statistics, and country completion progress
- **Achievement System**: Unlock badges for streaks, mastery, and milestones
- **Mobile-First Design**: Touch-friendly UI optimized for phones and tablets
- **PWA Support**: Add to home screen for app-like experience

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Styling**: Custom CSS with CSS variables (no framework dependencies)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd municipality-learner
   ```

2. **Set up the database**
   ```bash
   # Create the database
   createdb municipality_learner

   # Run schema and seed files
   psql municipality_learner < server/db/schema.sql
   psql municipality_learner < server/db/seed-slovenia.sql
   ```

3. **Configure environment**
   ```bash
   # Copy example env file
   cp .env.example server/.env

   # Edit with your database credentials
   # DATABASE_URL=postgresql://user:password@localhost:5432/municipality_learner
   ```

4. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server && npm install

   # Install client dependencies
   cd ../client && npm install
   ```

5. **Run development servers**
   ```bash
   # Terminal 1: Start the API server
   cd server && npm run dev

   # Terminal 2: Start the React dev server
   cd client && npm start
   ```

6. **Open in browser**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

### Docker Setup (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- PostgreSQL database on port 5432
- API server on port 3001
- React frontend on port 3000

## Project Structure

```
municipality-learner/
├── client/                 # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json   # PWA manifest
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── Dockerfile
│   └── package.json
├── server/
│   ├── routes/             # API route handlers
│   ├── models/             # Business logic & SM-2 algorithm
│   ├── db/
│   │   ├── index.js        # Database connection
│   │   ├── schema.sql      # Database schema
│   │   └── seed-slovenia.sql
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── public/
│   └── audio/              # MP3 pronunciation files
├── scripts/
│   └── generate-audio.js   # TTS audio generation script
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/question` | Get next municipality for review |
| POST | `/api/answer` | Submit answer for a question |
| GET | `/api/progress` | Get overall progress statistics |
| GET | `/api/progress/:countryId` | Get progress for specific country |
| GET | `/api/countries` | List all countries with status |
| GET | `/api/streak` | Get current daily streak |
| GET | `/api/achievements` | Get all achievements |
| GET | `/audio/:filename` | Serve audio files |

### Example: Get Next Question

```bash
curl http://localhost:3001/api/question

# Response:
{
  "id": 1,
  "questionType": "text_to_country",
  "municipalityName": "Ljubljana",
  "stats": {
    "correctCount": 0,
    "incorrectCount": 0,
    "easeFactor": 2.5,
    "intervalDays": 1
  }
}
```

### Example: Submit Answer

```bash
curl -X POST http://localhost:3001/api/answer \
  -H "Content-Type: application/json" \
  -d '{"municipalityId": 1, "userAnswer": "Slovenia", "questionType": "text_to_country"}'

# Response:
{
  "correct": true,
  "feedback": {
    "correctAnswer": "Slovenia",
    "userAnswer": "Slovenia",
    "municipality": "Ljubljana"
  },
  "progress": {
    "easeFactor": 2.5,
    "intervalDays": 1,
    "nextReview": "2024-01-02T00:00:00.000Z"
  }
}
```

## SM-2 Spaced Repetition Algorithm

The app implements the SuperMemo SM-2 algorithm:

1. **Quality Assessment**: Answers rated 0-5 (we use correct=4, incorrect=1)
2. **Ease Factor**: Starts at 2.5, adjusted based on performance
3. **Interval Calculation**:
   - First correct: 1 day
   - Second correct: 6 days
   - Subsequent: previous interval × ease factor
4. **On incorrect**: Interval resets to 1 day

## Audio Files

Audio files should be placed in `/public/audio/` with the naming convention:
```
{country-code}-{municipality-name-lowercase}.mp3
```

Example: `si-ljubljana.mp3`

### Generating Audio

Use the included script with a TTS service:

```bash
# Generate placeholder files (testing)
node scripts/generate-audio.js

# Generate with Google Cloud TTS
node scripts/generate-audio.js --service=google --country=SI

# Dry run to see what would be generated
node scripts/generate-audio.js --dry-run
```

## Adding New Countries

1. Add country to `server/db/schema.sql` or create a new seed file:
   ```sql
   INSERT INTO countries (name, code, municipality_count)
   VALUES ('Croatia', 'HR', 428);
   ```

2. Add municipalities:
   ```sql
   INSERT INTO municipalities (name, country_id, audio_file) VALUES
   ('Zagreb', 2, 'hr-zagreb.mp3'),
   ('Split', 2, 'hr-split.mp3');
   ```

3. Initialize progress:
   ```sql
   INSERT INTO user_progress (municipality_id, next_review)
   SELECT id, NOW() FROM municipalities WHERE country_id = 2;
   ```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | - | PostgreSQL connection string |
| PORT | 3001 | API server port |
| NODE_ENV | development | Environment mode |

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- iOS Safari 13+
- Android Chrome 80+

## Security Notes

- No authentication (single-user family app)
- `robots.txt` blocks search engines
- No sensitive data stored
- Intended for private network access

## License

MIT
