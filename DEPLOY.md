# Deploying BidStorm

A click-by-click runbook for putting BidStorm online for a **resume / low-traffic**
demo. Total cost: **$0** on free tiers (you may hit a small monthly bill only if
you outgrow them, which a demo won't).

The app is three pieces that must live in three places:

| Piece | Why it can't go just anywhere | Where it goes |
|-------|-------------------------------|---------------|
| **Server** (Express + Socket.io + node-cron) | Needs a **persistent process** for WebSockets and cron. Serverless (Vercel functions) can't hold a socket open or run a nightly job. | **Railway** or **Render** |
| **Database** (MySQL 8) | Schema uses FULLTEXT, foreign keys, transactions, row locking → needs **real MySQL 8**, not a Postgres/edge clone. | **Railway MySQL** or **Aiven** |
| **Images** | Host filesystems are **ephemeral** — files written at runtime vanish on the next redeploy. | **Cloudinary** (CDN) |
| **Client** (Vite SPA) | Static files, no server needed. | **Vercel** |

---

## What changes from local → global (and how this repo handles it)

These are the things that silently break when you move off localhost. All of them
are already handled in code — you only need to set the env vars.

1. **Images disappear on redeploy.** Ephemeral disk. → Code uploads to **Cloudinary**
   when `CLOUDINARY_*` env vars are set (falls back to local disk in dev). See
   `server/src/services/imageService.ts`.
2. **The login cookie stops working across domains.** The refresh-token cookie is
   cross-site once the SPA and API are on different domains, so it needs
   `SameSite=None; Secure`. → Handled in `authController.ts` (`config.isProd`).
3. **Secure cookies never get set / rate-limiting sees one IP.** The host puts a
   reverse proxy in front of you. → `app.set('trust proxy', 1)` in `app.ts`.
4. **CORS blocks the frontend.** Allowed origin must be the real deployed URL(s),
   not `localhost`. → Driven by `CLIENT_ORIGIN` (comma-separated for Vercel
   preview + prod). Applies to both HTTP (`app.ts`) and Socket.io (`socketManager.ts`).
5. **The DB connection is rejected without TLS.** Managed MySQL requires SSL. →
   `DB_SSL=true` enables it in `db.ts`.
6. **Secrets can't be hardcoded.** All config is env-driven; nothing is committed.
   → set every var in each host's dashboard.
7. **Email verification links point at localhost.** → `CLIENT_ORIGIN` is used to
   build the redirect, so it's correct once set.

---

## Step 1 — Database (Railway MySQL)

1. Create an account at [railway.app](https://railway.app) → **New Project**.
2. **+ New → Database → Add MySQL.** Wait for it to provision.
3. Open the MySQL service → **Variables** / **Connect** tab. Note:
   `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
4. Load the schema + seeds. From your machine, using the Railway connection
   details (the **public** host/port from the Connect tab):
   ```bash
   # runs all 17 migrations then the seeds, in order
   for f in database/migrations/*.sql database/seeds/*.sql; do
     mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE> < "$f"
   done
   ```
   (On Windows use Git Bash, or run each file through a MySQL GUI like DBeaver/Workbench.)

---

## Step 2 — Image storage (Cloudinary)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier).
2. On the **Dashboard**, copy **Cloud name**, **API Key**, **API Secret**.
3. You'll paste these into the server host in Step 3. Nothing else to configure —
   the code creates the `bidstorm/auctions/<id>` folders automatically.

---

## Step 3 — Server (Railway)

1. In the same Railway project: **+ New → GitHub Repo** → pick this repo.
2. **Settings → Root Directory:** `server`
3. **Settings → Build Command:** `npm install && npm run build`
   **Start Command:** `npm start`
4. **Variables** — add all of these:
   ```
   NODE_ENV=production
   PORT=5000
   CLIENT_ORIGIN=https://<your-app>.vercel.app     # fill in after Step 4; can be a comma list
   DB_HOST=<MYSQLHOST>
   DB_PORT=<MYSQLPORT>
   DB_USER=<MYSQLUSER>
   DB_PASSWORD=<MYSQLPASSWORD>
   DB_NAME=<MYSQLDATABASE>
   DB_SSL=true
   JWT_ACCESS_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_REFRESH_SECRET=<generate a second one>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=<from Step 2>
   CLOUDINARY_API_KEY=<from Step 2>
   CLOUDINARY_API_SECRET=<from Step 2>
   FROM_EMAIL=noreply@bidstorm.com
   # SMTP_* optional — leave blank to skip real emails (verification link still works
   # via the redirect; check server logs for the token in dev)
   ```
   > **Tip:** if the MySQL DB is in the same Railway project, you can reference its
   > private variables directly (e.g. `DB_HOST=${{MySQL.MYSQLHOST}}`) instead of
   > pasting values.
5. Deploy. Once green, open **Settings → Networking → Generate Domain**. Note the
   URL, e.g. `https://bidstorm-server.up.railway.app`. Verify:
   `https://bidstorm-server.up.railway.app/api/health` → `{"success":true,...}`.

---

## Step 4 — Client (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
2. **Root Directory:** `client`. Framework preset: **Vite** (auto-detected).
   Build: `npm run build`, Output: `dist` (defaults are correct).
3. **Environment Variables:**
   ```
   VITE_API_URL=https://bidstorm-server.up.railway.app/api
   VITE_SOCKET_URL=https://bidstorm-server.up.railway.app
   ```
4. Deploy. Note the resulting URL, e.g. `https://bidstorm.vercel.app`.

---

## Step 5 — Close the loop

1. Go back to the **Railway server → Variables** and set `CLIENT_ORIGIN` to the
   Vercel URL from Step 4. To also allow preview deploys, use a comma list:
   `https://bidstorm.vercel.app,https://bidstorm-git-main-<you>.vercel.app`.
   Redeploy the server.
2. Open the Vercel URL, register a user, and confirm:
   - Registration + login work (cookie set, stays logged in on refresh).
   - Creating an auction with an image → image loads (served from `res.cloudinary.com`).
   - A live auction updates in real time in a second browser tab (Socket.io).

---

## Cost summary

| Service | Free tier | Realistic demo cost |
|---------|-----------|---------------------|
| Vercel (client) | Generous hobby tier | **$0** |
| Railway (server + MySQL) | $5 free credit/month; small usage-based after | **$0–5/mo** |
| Cloudinary (images) | 25 GB storage + 25 GB bandwidth/mo | **$0** |

For a resume project seen by a handful of people, expect **$0**. Railway's trial
credit covers the always-on server; if it lapses, Render's free web service is an
alternative (note: it sleeps after inactivity and cold-starts in ~30s).

---

## Alternative: Render instead of Railway

Render works the same way — create a **Web Service** (root `server`, build
`npm install && npm run build`, start `npm start`) and a separate managed
MySQL (Render doesn't offer MySQL natively; use **Aiven** free MySQL and set
`DB_SSL=true` with Aiven's host/port/credentials). Everything else is identical.
The free web service **spins down when idle**, so the first request after a quiet
period is slow — fine for a demo, worth mentioning if a reviewer hits it cold.
