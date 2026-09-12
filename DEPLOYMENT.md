# Shivam Travels — Deployment Guide

This covers exact deployment steps for:

- **Frontend** → Vercel
- **Backend** → Render
- **Database** → MongoDB Atlas
- **Images** → Cloudinary

---

## 1. MongoDB Atlas

1. Create a free/shared cluster.
2. Database Access → add a user with a strong password (read/write on this project's database).
3. Network Access → add `0.0.0.0/0` (Render's outbound IPs are not static on the free plan) or Render's specific egress IPs if you're on a paid Render plan with static IPs.
4. Get the connection string — this is your `MONGO_URI`, e.g.:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shivam-travels?retryWrites=true&w=majority
   ```

---

## 2. Render (backend)

**Root Directory:** `server`
**Runtime:** Node
**Build Command:** `npm install`
**Start Command:** `npm start`
**Health Check Path:** `/api/health`

`render.yaml` in the repo root already encodes all of this — if you connect the repo via a Render Blueprint, most of this is automatic. Otherwise, create a Web Service manually with the settings above.

### Redis (required for production rate limiting)

Every rate limiter (login, OTP, password reset, token refresh, uploads, booking/enquiry submission, global safety net) is backed by Redis so limits are enforced correctly and shared across multiple backend instances — see `server/src/middleware/rateLimiters.js`.

1. Provision a managed Redis instance — Render's own Key Value/Redis add-on, or any provider (Upstash, Redis Cloud, etc). A small/free tier is plenty; this app only stores small short-lived counters, not application data.
2. Set `REDIS_URL` to the connection string it gives you (`redis://` or `rediss://` for TLS).
3. If you don't set `REDIS_URL` at all, the app still starts and rate limiting falls back to a per-instance in-memory store — fine for a quick single-instance test deploy, but each instance would track its own counters independently, so this is not recommended once you run more than one instance or care about the counters surviving a restart.
4. Reuse a single Redis you already have for this project — don't provision a second one for rate limiting alone.

### Required environment variables (set in Render dashboard)

| Key | Example / Notes |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | long random string (e.g. `openssl rand -hex 32`) |
| `CLIENT_URL` | `https://your-app.vercel.app` (no trailing slash) |
| `ALLOWED_ORIGINS` | same as `CLIENT_URL`; comma-separate if you have more than one (e.g. a preview domain) |
| `ADMIN_PUBLIC_PATH` | e.g. `secure-admin` — change from the default before going live |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `ADMIN_PASSWORD` is used only by the one-time seed script. `ADMIN_EMAIL` is also used at runtime — it's both the seeded admin's login email and the inbox that receives "New Booking Received" / "New Enquiry Received" notification emails. |
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `30` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from your Cloudinary dashboard |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Brevo SMTP (`smtp-relay.brevo.com`, port `587`, secure `false`) — used for OTP/password-reset email and for admin notification emails on new public bookings and enquiries. `SMTP_USER`/`SMTP_PASS` are your Brevo SMTP login and SMTP key; `MAIL_FROM` must be a sender verified in your Brevo account. |
| `REDIS_URL` | See "Redis" section above. Required for correct multi-instance rate limiting in production. |
| `RATE_LIMIT_MAX` | `1000` — only tunes the generous global safety-net limiter, not any specific endpoint's protection. |
| `TRUST_PROXY_HOPS` | `1` — number of reverse-proxy hops in front of the server (Render's edge = 1). Do not set higher than the real number of hops. |
| `MONGO_MAX_POOL_SIZE` / `MONGO_MIN_POOL_SIZE` | `20` / `2` |

The server refuses to start if `MONGO_URI` or `JWT_SECRET` is missing (fails loudly with a clear log message rather than starting in a broken state) — this is intentional. It does NOT refuse to start if `REDIS_URL` is missing (rate limiting degrades to the in-memory fallback described above with a clear warning in the logs) — this is also intentional, since Redis is important but a hard requirement to boot would make an existing single-instance deployment brittle.

### Verify after deploy
```
curl https://your-backend.onrender.com/api/health
# -> {"success":true,"message":"Shivam Travels API is running."}

curl https://your-backend.onrender.com/api/seo/sitemap.xml
curl https://your-backend.onrender.com/api/seo/robots.txt
```

---

## 3. Vercel (frontend)

**Root Directory:** `client`
**Framework Preset:** Vite
**Build Command:** `npm run build` (already set in `client/vercel.json`)
**Output Directory:** `dist` (already set in `client/vercel.json`)

### Required environment variables (set in Vercel dashboard, all environments)

| Key | Example |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` (with or without the trailing `/api` — the client normalizes it either way) |
| `VITE_SITE_URL` | `https://your-app.vercel.app` (your **final** custom domain if you have one — this is baked into canonical URLs, JSON-LD, and the generated sitemap/robots.txt at build time) |
| `VITE_ADMIN_PATH` | must match the backend's `ADMIN_PUBLIC_PATH`, e.g. `secure-admin` |

**Important:** `VITE_*` variables are baked in at **build time**, not read at runtime. If you change `VITE_SITE_URL` after the first deploy (e.g. after attaching a custom domain), you must **redeploy** (trigger a new build) for canonical URLs and the sitemap to update.

### How SPA routing + sitemap/robots coexist
`client/vercel.json` has a catch-all rewrite (`/(.*) → /index.html`) so refreshing `/vehicles/innova` or any deep link works instead of 404ing. Vercel serves an existing **static file** in the output directory before it ever applies a rewrite — so `dist/sitemap.xml` and `dist/robots.txt`, which are generated fresh on every build by `client/scripts/generate-seo-files.mjs` (runs automatically as the npm `postbuild` step), are served directly as real files at:
```
https://your-app.vercel.app/sitemap.xml
https://your-app.vercel.app/robots.txt
```
— not swallowed by the SPA fallback, and not just available at a backend API URL.

That script best-effort fetches `${VITE_API_URL}/vehicles` at build time to include real vehicle detail pages in the sitemap; if the backend isn't reachable during the build, it logs a warning and falls back to the static pages only (home, about, services, vehicles, booking, faq, contact) — it never fails the build.

### Verify after deploy
```
curl https://your-app.vercel.app/sitemap.xml     # real XML, not index.html
curl https://your-app.vercel.app/robots.txt       # real robots.txt, not index.html
curl -I https://your-app.vercel.app/vehicles       # 200, not 404, on a hard refresh
curl -I https://your-app.vercel.app/some/bogus/url # 200 (SPA serves index.html; React Router then shows the 404 page client-side — see note below)
```

**Note on 404s:** Because this is a client-rendered SPA behind a catch-all rewrite, an invalid URL returns HTTP 200 with `index.html`, and React Router then renders the `NotFound` component client-side with a `noindex, nofollow` meta tag. This is standard, expected behavior for SPAs on Vercel (there is no server-side render step to return a true HTTP 404) — search engines respect the `noindex` meta tag correctly, so this does not cause indexing problems.

---

## 4. Cloudinary

Create a free account, grab **Cloud Name**, **API Key**, **API Secret** from the dashboard, set them as the three `CLOUDINARY_*` env vars on Render. No frontend Cloudinary config is needed — all uploads go through the backend.

---

## 5. First-time database seed (optional)

If starting from an empty database:
```bash
cd server
npm install
# with MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD set in server/.env
npm run seed
```
This creates the first admin account and sample vehicles/services/pricing. Change the admin password immediately after first login in production.

---

## 6. SEO checklist

- [ ] `VITE_SITE_URL` set to the **final** production domain before the last pre-launch build.
- [ ] `https://your-domain/sitemap.xml` returns valid XML with your real vehicle URLs (not just the 7 static pages).
- [ ] `https://your-domain/robots.txt` disallows `/secure-admin` (or your `ADMIN_PUBLIC_PATH`) and `/api/`, and points `Sitemap:` at the same domain.
- [ ] Every public page (Home, About, Services, Vehicles, Vehicle detail, Booking, FAQ, Contact) has a unique title + description — check via view-source or a browser SEO extension.
- [ ] Admin pages all render `<meta name="robots" content="noindex, nofollow">` (already enforced globally by `AdminLayout`/`AdminAuthLayout` — confirm in view-source on `/secure-admin/login` and `/secure-admin/dashboard`).
- [ ] JSON-LD validates with no errors: https://validator.schema.org/ (paste a page's `<script type="application/ld+json">` content).
- [ ] Business name, phone, address in JSON-LD match reality (populate via Admin → Settings/Business).
- [ ] No `localhost` URLs anywhere in a production page's source.

## 7. Google Search Console steps

1. Go to https://search.google.com/search-console and add your property (use the "URL prefix" method with your exact `https://your-domain` — must match `VITE_SITE_URL` exactly, including `www` vs non-`www`).
2. Verify ownership (HTML file, DNS TXT record, or Google Analytics — whichever is easiest for your DNS host).
3. Sitemaps → submit `sitemap.xml` (just the filename; Search Console appends it to your verified property URL).
4. URL Inspection → test a few key URLs (`/`, `/vehicles`, `/booking`) to confirm Google can fetch and render them (checks that the SPA isn't blocked by robots.txt and renders content, not a blank shell).
5. Wait a few days, then check Coverage/Indexing reports for any "blocked by robots.txt" or "noindex detected" surprises — should show 0 for your public pages, and your admin path should correctly show as excluded.

## 8. Final production test checklist

**Public**
- [ ] Home → Services → Vehicles → Booking → Contact navigation all work, page starts at top on each navigation.
- [ ] Vehicle detail pages load for a few different slugs.
- [ ] Booking form: One Way and Round Trip both submit successfully; a real booking appears in Admin → Bookings.
- [ ] Enquiry/contact form submits successfully.
- [ ] Call and WhatsApp buttons open the right app/number.
- [ ] Language toggle (EN/TA) persists across a refresh and across pages, independently per browser.
- [ ] Hard-refresh on a deep link (e.g. `/vehicles/some-slug`) does not 404.
- [ ] Mobile menu opens/closes and closes after selecting a link.
- [ ] `/sitemap.xml` and `/robots.txt` return real content, not the SPA shell.

**Admin**
- [ ] Login, logout, forgot-password → OTP → reset-password all work end to end.
- [ ] Dashboard stats load.
- [ ] Bookings list, booking detail edit (dates, vehicle, driver, status, pricing) persist after a refresh, and each real change produces exactly one history entry.
- [ ] Vehicles/Services/Drivers/Pricing/FAQ/Content/SEO/Settings/Users CRUD all work.
- [ ] Image upload to Cloudinary works from at least one admin form (e.g. vehicle photo).
- [ ] CSV export downloads and opens correctly.

**Rate limiting**
- [ ] `REDIS_URL` is set on the deployed backend and the startup logs show `[Redis] Connected and ready.`
- [ ] Submitting the booking or enquiry form 16+ times quickly from one browser gets a 429 with a friendly message; a different browser/device submitting right after is unaffected.
- [ ] While one browser is rate-limited on the public form, the admin dashboard (a different login session) keeps working normally.
- [ ] Wrong admin password attempted repeatedly (8+) gets rate-limited; a login attempt for a different admin email from the same network is unaffected.
- [ ] If running more than one Render instance, confirm the counters above are shared (limited on one instance stays limited if the next request happens to hit another instance).

**Not verified in this environment** (no live MongoDB/Cloudinary/deployed domains available in this sandbox): the actual Render/Vercel/Atlas/Cloudinary accounts, real email delivery for OTP, and a real browser click-through of every flow above. The rate-limiting architecture itself WAS verified against a real Redis instance in this sandbox (see the audit report), independent of MongoDB. Everything above should be run once against your real deployment before calling it launched.
