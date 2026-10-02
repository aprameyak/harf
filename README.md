# Harf (حرف)

Learn to **read and decode Arabic script** into Latin-letter sounds.

Not a conversational Arabic course — no audio, no speaking, no translation drills. The product trains one skill: looking at Arabic writing and deriving how it sounds.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma + SQLite (swap `DATABASE_URL` for PostgreSQL in production)
- Auth.js / NextAuth v5 (credentials + guest)
- Framer Motion (respects `prefers-reduced-motion`)

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Local seed admin:** `admin@harf.app` / `harf1234` → [/admin](http://localhost:3000/admin) (seed credentials only)

## What’s included

1. Auth (signup, login, guest, password reset)
2. Short onboarding + optional placement
3. Full 10-stage structured learning path
4. Exercise engine: intro, Arabic↔Latin MC, matching, similar-letter, connected forms, build/type transliteration, find-the-mistake, speed recognition
5. Modular transliteration engine (`src/lib/transliteration/engine.ts`)
6. Mastery + spaced review queue
7. XP, streaks, levels, achievements
8. Progress alphabet map
9. Personalized **Review Weak Skills**
10. Content admin for units / lessons / exercises

## Curriculum data

Lessons and exercises live in the database (seeded from `prisma/seed.ts`), not hard-coded in React. Edit via `/admin` or re-seed.

## Transliteration

All Arabic→Latin mapping and answer validation goes through the engine. Change conventions there without rewriting UI components.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed letters + curriculum |
| `npm run db:reset` | Wipe DB and re-seed |
| `npm run test:engine` | Transliteration smoke tests |

## PostgreSQL

Set in `.env`:

```
DATABASE_URL="postgresql://USER:PASS@HOST:5432/harf"
```

Change `provider` in `prisma/schema.prisma` to `postgresql`, then `npm run db:push && npm run db:seed`.

## License

MIT
