# Harf (حرف)

Learn to read Arabic script into Latin-letter sounds. No conversation drills, no audio, no translation practice — only decoding writing into pronunciation.

## Stack

Next.js 16, TypeScript, Tailwind CSS 4, Prisma + SQLite, Auth.js v5 (credentials + guest), Framer Motion

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

Seed admin (local only): `admin@harf.app` / `harf1234` → `/admin`

## Features

- Auth, onboarding, optional placement
- 10-stage curriculum in the database (`prisma/seed.ts`)
- Exercises: MC, matching, similar letters, connected forms, type transliteration, find-the-mistake, speed recognition
- Transliteration engine in `src/lib/transliteration/engine.ts`
- Mastery, review queue, XP / streaks / achievements
- Alphabet progress map and weak-skill review
- Admin for units, lessons, exercises

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed curriculum |
| `npm run db:reset` | Wipe DB and re-seed |
| `npm run test:engine` | Transliteration smoke tests |

## PostgreSQL

```
DATABASE_URL="postgresql://USER:PASS@HOST:5432/harf"
```

Set `provider = "postgresql"` in `prisma/schema.prisma`, then `npm run db:push && npm run db:seed`.

## License

MIT
