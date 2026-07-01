# Felovy — Setup Guide

## Prerequisites
- Node.js 18+
- npm
- A Supabase project
- Accounts on: Resend, ImageKit, Cloudinary

## 1. Install & configure

```bash
npm install
cp .env.example .env
# Fill in all values in .env
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API runs at `/api` on the same server — no separate backend process.

## 2. Supabase Storage

Create a public storage bucket called `felovy` in your Supabase dashboard:
- Storage → New Bucket → Name: `felovy` → Public: YES

## 3. Create Owner Account

POST to `http://localhost:3000/api/auth/admin/signup` with:

```json
{
  "email": "your@email.com",
  "password": "your_secure_password",
  "fullName": "Site Owner",
  "ownerSecret": "your_owner_creation_secret"
}
```

## 4. Deploy to Vercel (one project)

1. Push this repo to GitHub
2. Import it on [vercel.com/new](https://vercel.com/new)
3. Leave **Root Directory** empty (project root)
4. Copy every variable from `.env` into Vercel → Settings → Environment Variables
5. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. `https://felovy.vercel.app`)
6. Deploy

That's it — frontend and API deploy together as one Next.js app.

## Project Structure

```
Felovy/
├── .env                 Single config file
├── pages/api/[...all].ts  Express API mounted at /api/*
├── prisma/              Database schema
└── src/
    ├── app/             Next.js pages
    ├── server/          Express API (auth, jobs, messages, …)
    ├── components/
    └── lib/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (frontend + API) |
| `npm run build` | Production build |
| `npm test` | Frontend unit tests |
| `npm run test:api` | API unit/integration tests |
| `npm run prisma:studio` | Open Prisma Studio |
