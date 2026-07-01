# Felovy — Setup Guide

## Prerequisites
- Node.js 18+
- npm or pnpm
- A Supabase project (already configured in .env)
- Accounts on: Resend, ImageKit, Cloudinary

## 1. Backend Setup

```bash
cd backend
npm install

# Push Prisma schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server (port 4000)
npm run dev
```

### Required .env values to fill in `backend/.env`:
- `DATABASE_URL` and `DIRECT_URL` — from Supabase project settings → Database → Connection string
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Settings → API (never expose to frontend)
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — generate with `openssl rand -hex 32`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` — create a GitHub OAuth App at github.com/settings/developers
  - Callback URL: `http://localhost:4000/api/auth/github/callback`
- `OWNER_SECRET` — any secret string you choose

## 2. Frontend Setup

```bash
cd frontend
npm install

# Start dev server (port 3000)
npm run dev
```

## 3. Supabase Storage

Create a public storage bucket called `felovy` in your Supabase dashboard:
- Go to Storage → New Bucket
- Name: `felovy`
- Public: YES

## 4. Create Owner Account

POST to `http://localhost:4000/api/auth/admin/signup` with:
```json
{
  "email": "mirocrush@gmail.com",
  "password": "your_secure_password",
  "fullName": "Site Owner",
  "ownerSecret": "your_owner_creation_secret"
}
```

## 5. Production Deployment (Vercel)

### Backend:
1. Push `backend/` folder as a separate Vercel project
2. Add all env variables in Vercel dashboard
3. Set `FRONTEND_URL` to your frontend Vercel URL

### Frontend:
1. Push `frontend/` folder as a separate Vercel project
2. Add env variables in Vercel dashboard
3. Set `NEXT_PUBLIC_API_URL` to your backend Vercel URL

## Project Structure

```
Felovy/
├── backend/           Express API (deploys to Vercel serverless)
│   ├── src/
│   │   ├── config/    DB, Supabase, ImageKit, Cloudinary
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/  Email, Upload
│   │   ├── utils/     JWT, OTP
│   │   └── index.ts
│   └── prisma/schema.prisma
│
└── frontend/          Next.js 14 App Router
    └── src/
        ├── app/       Pages (landing, auth, jobs, dashboards)
        ├── components/ UI components
        ├── lib/        API client, utilities
        ├── store/      Zustand auth store
        └── types/      TypeScript types
```
