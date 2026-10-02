# Harf (حرف)

Read Arabic script into Latin-letter sounds.

## Setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

http://localhost:3000

Seed admin (local): `admin@harf.app` / `harf1234`

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Build |
| `npm run db:seed` | Seed curriculum |
| `npm run db:reset` | Wipe + re-seed |
| `npm run test:engine` | Transliteration tests |

Postgres: set `DATABASE_URL`, switch `provider` in `prisma/schema.prisma`, then `npm run db:push && npm run db:seed`.

## License

MIT
