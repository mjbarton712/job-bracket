# Job Bracket Challenge 🏆

A fun and interactive double-elimination bracket competition to help you discover which careers interest you most! Compare 128 different jobs head-to-head in a tournament-style experience.

## Features

- **128-Job Tournament**: A comprehensive list of jobs across various industries.
- **Neo-Brutalism Design**: A bold, high-contrast UI for a modern feel.
- **Double Elimination**: Each job gets two chances before being eliminated - fair and comprehensive
- **Winners & Losers Brackets**: Jobs that lose in the main bracket get another shot in the losers bracket
- **Interactive UI**: Beautiful, responsive design with smooth animations
- **Track Progress**: See your completion percentage and remaining jobs in real-time
- **Personalized Results**: Get your top 5 job preferences ranked by your choices

## How It Works

1. **Start Tournament**: Click to begin your career exploration journey
2. **Compare Jobs**: You'll be presented with two jobs at a time - choose the one that interests you more
3. **Progress Through Rounds**: Continue making choices as jobs advance through the bracket
4. **Second Chances**: Jobs that lose once move to the losers bracket for a second opportunity
5. **See Results**: Once complete, view your top 5 career preferences based on your selections

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: React 19

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd job-bracket

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start the tournament!

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main tournament page
├── components/
│   ├── JobCard.tsx        # Individual job display card
│   ├── MatchView.tsx      # Head-to-head comparison view
│   ├── ProgressBar.tsx    # Tournament progress tracker
│   ├── MBTISelector.tsx   # Myers-Briggs selection UI with summaries
│   └── Results.tsx        # Final results display with MBTI context
├── data/
│   └── jobs.ts            # 300+ job catalog with Myers-Briggs metadata
├── lib/
│   └── bracketLogic.ts    # Tournament management and MBTI-based curation
└── types/
    └── bracket.ts         # TypeScript type definitions
```

## Customization

### Adding Your Own Jobs

Edit `src/data/jobs.ts` to customize the list of jobs. Each job requires:
- `id`: Unique number
- `title`: Job name
- `description`: Brief description

### Styling

The app uses Tailwind CSS. Modify component styles directly in the TSX files or update `tailwind.config.ts` for global theme changes.

## Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run ESLint
```

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ using Next.js and TypeScript
