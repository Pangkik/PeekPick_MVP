# PeekPick

Swipe-to-swap barter app. Trade what you have for what you need — no money, ever.

**Live:** https://peek-pick-final.vercel.app

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui (hosted on Vercel)
- **Backend:** Express + SQLite in `server/` (hosted on Railway)

## Run locally

```sh
npm install
npm run seed      # create demo users & items (once)
npm run server    # API on http://localhost:3001
npm run dev       # app on http://localhost:8080
```

Demo login: `ella@peekpick.demo` / `demo1234`

Signup verification codes are printed to the server console.

## Tests

```sh
npm run test:server   # backend end-to-end self-check
npm test              # frontend unit tests
```

## Deployment

- Pushing to `main` auto-deploys the frontend (Vercel) and backend (Railway).
- Vercel needs env var `VITE_API_BASE_URL` pointing at the Railway URL.
- Railway needs `JWT_SECRET`, `PEEKPICK_DB_PATH=/data/peekpick.db`, `PEEKPICK_UPLOADS_DIR=/data/uploads`, and a volume mounted at `/data`.
