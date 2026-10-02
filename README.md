# Harf (حرف)

Learn to **read and decode Arabic script** into Latin-letter sounds.

Not a conversational Arabic course — no audio, no speaking, no translation drills. The product trains one skill: looking at Arabic writing and deriving how it sounds.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma + SQLite (swap `DATABASE_URL` for PostgreSQL in production)
- Auth.js / NextAuth v5 (credentials + guest; ready for OAuth later)
- Framer Motion (respects `prefers-reduced-motion`)

## Quick start

```bash
cd harf
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Admin:** `admin@harf.app` / `harf1234` → [/admin](http://localhost:3000/admin)

## What the MVP includes

1. Auth (signup, login, guest, password reset)
2. Short onboarding + optional placement
3. Structured learning path (Stages 1–4 content + later stage placeholders)
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
| `npm run db:seed` | Seed letters + beginner units |
| `npm run db:reset` | Wipe DB and re-seed |
| `npx tsx scripts/test-engine.ts` | Transliteration smoke tests |

## PostgreSQL

Set in `.env`:

```
DATABASE_URL="postgresql://USER:PASS@HOST:5432/harf"
```

Change `provider` in `prisma/schema.prisma` to `postgresql`, then `npx prisma db push && npm run db:seed`.

## Product north star

A learner who once saw `كَتَبَ` as noise should independently decode **kataba** — then keep decoding harder vowelled Arabic without Latin crutches.
