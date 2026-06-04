# AAUC Admin

TypeScript admin panel for the **Alpha Alpha Upsilon Chapter** public site (`aauc-sigma`). Manages Firestore events and registrations for the shared Firebase project (`aauc-site`).

## Features

- **Auth** — Firebase email/password sign-in with httpOnly session cookies; optional `ADMIN_EMAILS` allowlist
- **Events** — list, create, edit, publish/unpublish, delete drafts, upload images to Storage, configure conference pricing tiers
- **Registrations** — filter by event/status, search, view details (including tag photos), update payment status, export CSV

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Firebase Admin SDK (Firestore + Storage) on server Route Handlers
- Firebase Auth (client) for login only

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Add Firebase web config and a service account JSON (same project as the public site).

3. Create admin users in [Firebase Console](https://console.firebase.google.com) → Authentication → Users (no public sign-up).

4. Optionally set `ADMIN_EMAILS` to restrict who can sign in.

5. Run the dev server:

   ```bash
   npm install
   npm run dev
   ```

6. Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## Deploy (Vercel)

- Set all `NEXT_PUBLIC_FIREBASE_*` variables
- Set `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string)
- Set `ADMIN_EMAILS` in production
- Deploy Firestore composite indexes from the public repo if not already deployed

## Routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard |
| `/admin/login` | Sign in |
| `/admin/events` | Event list |
| `/admin/events/new` | Create event |
| `/admin/events/[id]` | Edit event |
| `/admin/registrations` | Registration list |
| `/admin/registrations/[id]` | Registration detail |

## API (authenticated)

| Method | Route | Purpose |
|--------|-------|---------|
| POST/DELETE | `/api/auth/session` | Create / revoke session |
| GET/POST | `/api/admin/events` | List / CRUD events |
| GET | `/api/admin/registrations` | List (or `?format=csv`) |
| POST | `/api/admin/registrations/[id]` | Update status |
| POST | `/api/admin/upload` | Upload event image |

See `ADMIN_APP_CONTEXT.md` for full Firestore schema and integration notes with the public site.
