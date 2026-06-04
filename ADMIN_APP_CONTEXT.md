# TypeScript admin app — context document

This document describes everything a **TypeScript admin panel** needs to manage the **Alpha Alpha Upsilon Chapter** public site (`aauc-sigma`). It is derived from the Next.js landing site in this repo and the live Firebase project.

**Public site repo:** `gritpr/aauc-sigma`  
**Firebase project ID:** `aauc-site` (from env; confirm in your Firebase Console)  
**Production site:** Vercel deployment (e.g. `https://aauc-sigma.vercel.app`)

---

## 1. Purpose of the admin app

The public website is **read-only** for visitors. Today, chapter admins use Firebase Console for events and registrations. A TypeScript admin UI should replace that with:

- **Events** — create, edit, publish, upload images to Storage, set Paystack Shop links
- **Registrations** — list, filter, export, mark payment/confirmation status
- **Optional later** — site branding (currently in `src/config/site.ts` on the web app only)

The admin app uses the **same Firebase project** and should **reuse types and services** from this repo where possible.

### Recommended shape (TypeScript)

| Option | Pros |
|--------|------|
| **`/admin` routes in this repo** (preferred) | Shared `src/types/*`, `src/lib/firebase/*`, one Vercel deploy, Route Handlers with Admin SDK already wired |
| **Separate Next.js app** | Isolated deploy; copy or publish shared types package |

Do **not** put the service account in client-side code. Admin mutations go through **Route Handlers** (`src/app/api/admin/...`) using the existing Admin SDK setup in `src/lib/firebase/admin.ts`, same pattern as `POST /api/registrations`.

---

## 2. Public website stack (reference)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Data | Cloud Firestore |
| Files | Firebase Storage (HTTPS URLs stored on documents) |
| Hosting | Vercel |
| Payments | Paystack Shop links (conference); legacy API path exists but conference uses `paymentLink` |

**Public routes**

| Route | Purpose |
|-------|---------|
| `/` | Home, events preview |
| `/events` | Event list |
| `/events/[slug]` | Event detail + registration modal |
| `/about` | About page |
| `POST /api/registrations` | Creates registration (+ optional tag photo upload server-side) |

**Suggested admin routes** (to build)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard (auth-gated) |
| `/admin/events` | Event list (draft + published) |
| `/admin/events/[id]` | Event editor |
| `/admin/registrations` | Registration list / filters |
| `POST /api/admin/events` | CRUD events (Admin SDK) |
| `POST /api/admin/registrations/[id]` | Update status, etc. |
| `POST /api/admin/upload` | Event image → Storage → return URL |

---

## 3. Branding (web only today)

Defined in `src/config/site.ts` (not in Firestore):

| Field | Example |
|-------|---------|
| `chapterName` | Alpha Alpha Upsilon |
| `chapterNumber` | 594 (verify against official chapter #) |
| `institution` | Obafemi Awolowo University |
| `location` | Ile-Ife, Osun State, Nigeria |
| `primaryColor` | `#5E50A1` |

If the admin app should edit branding later, add a `siteSettings` collection or keep deploying web config changes.

---

## 4. Firestore collections

### 4.1 `events`

Document ID: auto-generated or custom.

**Query used by public site**

- Published list: `status == "published"` (ordered by `startDate` in app code)
- By slug: `slug == "{slug}"` AND `status == "published"`

**Query for admin**

- All events (no `status` filter), or `status in ["draft", "published"]`

**Required indexes** (see `firebase/firestore.indexes.json`):

- `status` ASC + `startDate` ASC  
- `slug` ASC + `status` ASC  

#### Core fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `slug` | string | yes | URL segment, e.g. `sigma-2026-conference` |
| `description` | string | yes | |
| `startDate` | timestamp | yes | |
| `endDate` | timestamp | yes | |
| `location` | string | yes | |
| `priceKobo` | number | yes | Default/base fee in kobo (₦1 = 100 kobo) |
| `status` | string | yes | `"draft"` \| `"published"` — only published visible on site |
| `createdAt` | timestamp | yes | |
| `updatedAt` | timestamp | yes | |

#### Optional / conference fields

| Field | Type | Notes |
|-------|------|-------|
| `capacity` | number | |
| `imageUrl` | string | Full HTTPS URL — card/list thumbnail (Firebase Storage) |
| `flierImageUrl` | string | Full HTTPS URL — detail hero (often same as flier) |
| `subtitle` | string | |
| `theme` | string | |
| `motto` | string | |
| `accreditation` | string | e.g. `3 NMCN Credit Units` |
| `venue` | string | Can differ from `location` |
| `pricingTiers` | array | See below — **if present, site treats event as “conference”** |
| `tracks` | array | `{ title, topics: string[] }[]` |
| `abstractSubmission` | map | See below |
| `contacts` | array | `{ name, phone }[]` |

#### `pricingTiers[]` item

| Field | Type | Notes |
|-------|------|-------|
| `label` | string | e.g. `Member`, `Non-Member`, `Students (Undergraduate)` |
| `amountKobo` | number | Fee for that tier |
| `paymentLink` | string | Paystack Shop URL — **used for conference checkout** |

**Tier matching on the website** (for registration fee + payment link):

| User selects | Matched when `label` contains |
|--------------|-------------------------------|
| `member` | `member` |
| `non_member` | `non-member`, `non member`, `nonmember` |
| `student` | `student`, `students`, `undergraduate` |

Reuse `src/lib/registration/pricing.ts` in admin previews (show resolved tier per status).

#### `abstractSubmission` map

| Field | Type | Notes |
|-------|------|-------|
| `wordLimit` | number | |
| `structure` | string | |
| `keywordsCount` | number | |
| `formats` | string[] | e.g. Oral / Poster |
| `guidelines` | string | **Shown on event detail page** — free text; may include email |

#### Example document (Sigma 2026 — production shape)

Reference slug: `sigma-2026-conference`. Includes `pricingTiers` with shared Paystack Shop link `https://paystack.shop/pay/sigma-aau3`, Storage URLs for flier, tracks, abstract guidelines with email `aausigmaconference2026@gmail.com`.

---

### 4.2 `registrations`

Created by the public site via **Next.js API** (Admin SDK). Admin needs **read + update** (and optionally delete) via **admin Route Handlers**, not direct client Firestore writes (unless you add Auth + rules).

**Design goal:** flat top-level fields for **Firestore → Export collection → CSV**.

| Field | Type | Notes |
|-------|------|-------|
| `eventId` | string | |
| `eventTitle` | string | Denormalized at create time |
| `fullName` | string | |
| `email` | string | Lowercased on create |
| `phone` | string | |
| `status` | string | `pending_payment` \| `payment_received` \| `confirmed` \| `cancelled` |
| `amount` | number | Kobo — from tier or `event.priceKobo` |
| `currency` | string | `NGN` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |
| `organization` | string \| null | Simple events |
| `role` | string \| null | Conference: required |
| `cadre` | string \| null | Conference |
| `preferredNameOnCertificate` | string \| null | Conference |
| `photoUrl` | string \| null | Firebase Storage URL — tag photo |
| `participantStatus` | string \| null | `member` \| `non_member` \| `student` |
| `gender` | string \| null | Conference |
| `industry` | string \| null | Conference |
| `institution` | string \| null | Conference |
| `paystackReference` | string \| null | Set by API webhook path if used |
| `paidAt` | timestamp \| null | |
| `emailSentAt` | timestamp \| null | |

**Conference vs simple registration**

- **Conference:** event has `pricingTiers.length > 0` → extended form + photo upload + Paystack Shop link.
- **Simple:** JSON body only; optional `organization`, `role`; may still use Paystack API if no `paymentLink`.

---

### 4.3 Other collections (low priority for v1)

| Collection | Purpose |
|------------|---------|
| `mail` | Firebase Trigger Email extension (server writes only) |
| `emailLogs` | Debug / stub email |

---

## 5. Firebase Storage

**Bucket:** value of `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (e.g. `aauc-site.firebasestorage.app`).

### Paths in use

| Path pattern | Purpose | Set by |
|--------------|---------|--------|
| `events/{slug}/...` or root objects like `sigma-2026-flyer.jpeg` | Event / flier images | Admin upload API; URL saved to `imageUrl` / `flierImageUrl` |
| `registrations/{registrationId}/tag-photo.jpg` | Conference tag photo | `POST /api/registrations` (existing) |

### Rules today (`firebase/storage.rules`)

- `events/**` — **public read**, no client write  
- `registrations/**` — **public read**, no client write  

Admin uploads should use **Admin SDK in Route Handlers** (same as tag photos), not browser Storage SDK, until rules grant authenticated admin writes.

### Image URLs on events

Store the **full download URL** on the Firestore document (not `/public/...` paths). `next.config.ts` already allows Storage hosts for `next/image`.

---

## 6. Registration & payment flows (public site)

### 6.1 Conference flow (current preferred)

1. User opens `/events/{slug}` → **Register & pay**.
2. Form fields: full name, email, phone, role, cadre, preferred name on certificate, picture (file), status (member / non-member / student), gender, industry, institution.
3. `POST /api/registrations` as **multipart/form-data**.
4. Server: validates, creates `registrations` doc, uploads photo to Storage, sets `photoUrl`.
5. If matching `pricingTiers[].paymentLink` exists → response `{ paymentUrl }` → browser opens Paystack Shop in new tab.
6. Registration stays `pending_payment` until admin confirms (no automatic webhook for Shop links).

### 6.2 Simple event flow

1. JSON `POST /api/registrations`.
2. Server may call Paystack **Initialize Transaction API** and return `authorizationUrl` (requires `PAYSTACK_SECRET_KEY` on Vercel).

### 6.3 Paystack Shop vs API

| Approach | When used | Admin implication |
|----------|-----------|-------------------|
| **Shop `paymentLink`** | Conference tiers | Set per tier in Firestore; reconcile in Paystack dashboard; mark `payment_received` / `confirmed` in admin UI |
| **Paystack API + webhook** | Optional / legacy | `POST /api/webhooks/paystack` can set `payment_received` automatically |

**Recommendation for admin v1:** treat Shop payments as **manual confirmation** after verifying Paystack dashboard or receipt emails.

---

## 7. Security — critical for admin

### Current Firestore rules (`firebase/firestore.rules`)

```
events:        public read IF published only; client writes DENIED
registrations: client read/write DENIED
```

Public registration creates still go through **`POST /api/registrations`** (Admin SDK).

### Recommended approach for TypeScript admin (this repo)

**Option A — Route Handlers + session (simplest v1)**

1. Add **Firebase Auth** (or NextAuth with Firebase) for chapter admin emails only.
2. Middleware on `/admin/*` and `/api/admin/*` checks session / custom claim `admin`.
3. All Firestore writes in Route Handlers via `getAdminFirestore()` — **no rule changes required** for v1 if every mutation is server-side.
4. Extend `src/services/events.ts` / `registrations.ts` with admin-only functions (list drafts, update status).

**Option B — Client Firestore + rules (later)**

- Set custom claim `admin: true` on admin users.
- Update rules to allow admin read/write on `events` and `registrations`.
- Public rules unchanged.

**Never** expose `FIREBASE_SERVICE_ACCOUNT_JSON` to the browser or `NEXT_PUBLIC_*` secrets.

### Suggested middleware checks

- Reject unauthenticated requests to `/api/admin/*`
- Optional: allowlist admin emails in env `ADMIN_EMAILS=admin@chapter.org,...`

### Storage

- Upload event images in admin API with Admin SDK → `events/{slug}/{filename}`
- Return public download URL for form fields

---

## 8. Admin UI — suggested features

### Events

- [ ] List all events (draft + published), sort by `startDate`
- [ ] Create / edit / delete draft
- [ ] Publish / unpublish (`status`)
- [ ] Upload flier/image via admin API → set `imageUrl` / `flierImageUrl`
- [ ] Edit `pricingTiers` (label, amountKobo, paymentLink) with live tier preview via `getParticipantStatusOptions()`
- [ ] Edit tracks, contacts, abstract submission (`guidelines`)
- [ ] Slug uniqueness check before save

### Registrations

- [ ] List by event, filter by `status`, search by email/name
- [ ] View detail including `photoUrl` (tag image)
- [ ] Mark `payment_received` / `confirmed` / `cancelled`
- [ ] Export CSV (flat fields match Firestore doc)
- [ ] Optional: Server Action or API route for bulk export per `eventId`

### Auth

- [ ] Login page under `/admin/login`
- [ ] No public sign-up; create users in Firebase Console

---

## 9. Environment & config

Reuse `.env.example` from this repo:

```bash
# Client (admin pages can use same Firebase web config)
NEXT_PUBLIC_FIREBASE_* 

# Server (already used by public API)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json   # local
FIREBASE_SERVICE_ACCOUNT_JSON=...                               # Vercel

# Optional admin gate
ADMIN_EMAILS=chapter-admin@example.com
```

Vercel: same project as public site if admin lives in this repo; protect `/admin` in production.

---

## 10. Code to reuse (no duplication)

| Concept | File |
|---------|------|
| Event types | `src/types/event.ts` |
| Registration types | `src/types/registration.ts` |
| Conference detection & tiers | `src/lib/registration/pricing.ts` |
| Registration create (public) | `src/services/registrations.ts` |
| Event reads (public) | `src/services/events.ts` |
| Admin SDK | `src/lib/firebase/admin.ts` |
| Service account env | `src/lib/firebase/serviceAccount.ts` |
| Registration validation | `src/lib/validation/registration.ts` |

**Add for admin:**

- `src/services/events.admin.ts` — list all, create, update, delete draft
- `src/services/registrations.admin.ts` — list by event, patch status
- `src/app/admin/**` — UI (Server Components + forms)
- `src/app/api/admin/**` — authenticated mutations

Import `ChapterEvent`, `Registration`, `RegistrationStatus` from existing types; use `isConferenceEvent()` when showing conference-only fields in the editor.

---

## 11. Amounts (kobo)

Nigerian Naira amounts are stored in **kobo** (1 NGN = 100 kobo).

| Display | Storage |
|---------|---------|
| ₦50,000 | `5000000` |
| ₦60,000 | `6000000` |
| ₦30,000 | `3000000` |

Admin forms: display Naira (`amountKobo / 100`), save as kobo. Share a small helper e.g. `koboToNaira` / `nairaToKobo` in `src/lib/money.ts` if needed.

---

## 12. Out of scope for admin v1

- Public marketing pages (`/`, `/about`) — stay static/config
- Changing public registration form fields without updating `RegistrationForm.tsx` + validation
- Seed scripts (removed from repo)
- Email extension configuration UI

---

## 13. Checklist before shipping admin

1. [ ] Admin auth on `/admin` and `/api/admin/*`
2. [ ] Route Handlers use Admin SDK only for writes
3. [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set on Vercel (already required for registrations)
4. [ ] Composite indexes deployed (`firebase deploy --only firestore:indexes`)
5. [ ] Publish draft event → visible on public `/events`
6. [ ] Edit `paymentLink` → public registration opens correct Shop URL
7. [ ] Status updates persist and appear in CSV export

---

## 14. Related files in this repo

```
firebase/firestore.rules
firebase/firestore.indexes.json
firebase/storage.rules
src/types/event.ts
src/types/registration.ts
src/services/events.ts
src/services/registrations.ts
src/lib/registration/pricing.ts
src/lib/firebase/admin.ts
src/components/events/RegistrationForm.tsx
src/app/api/registrations/route.ts
.env.example
README.md
```

---

*Last aligned with the `aauc-sigma` codebase. Update this doc when the web app or Firebase schema changes.*
