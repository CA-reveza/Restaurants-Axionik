# Truffles POS / KDS — Deployment Guide

One React + Vite codebase, three screens:

| Screen | Who uses it | Shows Navbar? |
|---|---|---|
| Admin/staff dashboard | Restaurant staff — table map, billing, menu, analytics | Yes |
| Kitchen Display (KDS) | Kitchen tablet | No — full-screen |
| Captive portal | Customers ordering from their phone | No — full-screen |

`src/context/RestoContext.jsx` auto-detects which screen to show based on **where it's
deployed** — no separate build or manual routing needed:

```js
if (host.includes("captive-portal") || pathname.includes("/portal")) return "captive_portal";
if (host.includes("kds-dashboard") || pathname.includes("/kds")) return "kds";
if (host.includes("pos-dashboard")) return "table_map";
```

So the same build, deployed three times under three differently-named services/projects,
just works. That's the approach both guides below use.

> **Heads up:** `public/kds/index.html` and `public/portal/index.html` are two older,
> separate implementations still present in this repo (a standalone vanilla-JS KDS page with
> a hardcoded Supabase key, and a customer-portal page pointing at a pre-built bundle that's
> frozen and no longer tracks current source). Both guides below deploy the **real, current
> React app** instead. If you have an existing Vercel setup pointed at those files, it will
> keep working untouched — see the Vercel section for how the two approaches differ.

---

## 0. Before you deploy: Supabase environment variables

Both platforms need these two variables set **before the first build**, because Vite bakes
`VITE_*` variables into the built JS at build time — adding them after a build won't do
anything until you rebuild:

- `VITE_SUPABASE_URL` — your Supabase project's URL (`https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — your Supabase project's anon/publishable key

Find both in your Supabase project → **Settings → API**. `.env.example` in this repo shows
the expected format; copy it to `.env` for local development (never commit the real `.env`).

---

## 1. Deploy to Render

This repo includes `render.yaml` at the root — a Blueprint that creates all three services
in one step.

1. Push `render.yaml` to your repo's default branch (if it isn't already there).
2. In the [Render Dashboard](https://dashboard.render.com), click **New → Blueprint**.
3. Connect this GitHub repo and select the branch.
4. Render reads `render.yaml` and shows three services to create:
   `pos-dashboard`, `kds-dashboard`, `captive-portal`.
5. You'll be prompted for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` **once per
   service** (they're marked `sync: false` in the blueprint, so they're entered as secrets in
   the dashboard, not committed to the repo). Fill in the same Supabase values for all three.
6. Click **Apply**. Render builds and deploys all three.

Once live, you'll have:
- `https://pos-dashboard.onrender.com` → admin dashboard
- `https://kds-dashboard.onrender.com` → kitchen display
- `https://captive-portal.onrender.com` → customer ordering screen

**Don't rename the services** away from those three names (or names that at least contain
`pos-dashboard` / `kds-dashboard` / `captive-portal`) — the name becomes the hostname Render
serves from, and that hostname is exactly what `RestoContext.jsx` checks to decide which
screen to show. Renaming a service means it silently falls back to the admin dashboard.

### If you'd rather set it up manually (no Blueprint)

For each of the three services, in **New → Static Site**:

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Redirect/Rewrite Rule | `/*` → `/index.html` (Rewrite, not Redirect) |
| Environment Variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

Make sure **Language/Runtime** is left as the auto-detected static site type — if you instead
create a generic **Web Service**, Render may try to guess a runtime (Python, in one observed
case) that has nothing to do with this project and the build will fail immediately looking
for files like `requirements.txt` that don't exist here.

### Updating environment variables later

Changing `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` in the dashboard after the fact requires
a **manual redeploy** (Render → service → Manual Deploy → Deploy latest commit) to actually
take effect, since they're baked in at build time, not read at runtime.

---

## 2. Deploy to Vercel

This repo already ships three Vercel rewrite configs (`vercel.pos.json`, `vercel.kds.json`,
`vercel.portal.json`) and matching `npm run deploy:*` scripts that swap the active
`vercel.json` before calling the Vercel CLI. There are two reasonable ways to use Vercel here
— pick based on whether you want the current three-implementation setup or the same
single-React-build approach used for Render above.

### Option A — keep the existing setup (admin app + legacy KDS/portal pages)

This is what the repo's scripts already do: `vercel.pos.json` serves the real React app,
while `vercel.kds.json`/`vercel.portal.json` serve the standalone vanilla-JS KDS page and the
frozen pre-built portal bundle mentioned above.

1. Install the Vercel CLI once: `npm i -g vercel`
2. For **each** of the three apps, work from a separate local clone (or a separate
   directory) of this repo and run `vercel link` inside it once, creating/selecting a
   distinct Vercel project per clone (e.g. `pos-dashboard`, `kds-dashboard`,
   `captive-portal`). This step matters: running `vercel link` links the current folder to
   one specific project, and the CLI deploys to whichever project is currently linked.
3. In each clone, add `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` under that project's
   **Settings → Environment Variables** on vercel.com (Production environment), then run
   `vercel pull --environment=production` once so the CLI build has them locally too.
4. From each clone, run the matching script:
   - `npm run deploy:pos` (in the clone linked to your admin-dashboard project)
   - `npm run deploy:kds` (in the clone linked to your KDS project)
   - `npm run deploy:portal` (in the clone linked to your portal project)

   Each script overwrites the local `vercel.json` with the right rewrite rule before calling
   `vercel --prod`.

**Important gotcha with GitHub-integrated auto-deploy:** if you instead connect a GitHub
repo directly to three separate Vercel projects (rather than deploying via the CLI as above),
all three will read whichever `vercel.json` is actually committed at that commit — there's
only one `vercel.json` file in the repo at any given time, and right now it happens to be a
copy of the portal config. GitHub auto-deploy on push will make every connected project serve
whatever that one file currently points to, not three different things. The CLI workflow
above works around this by swapping the file locally right before each deploy, which doesn't
require a commit. If you want reliable git-push auto-deploy for all three simultaneously,
use Option B below, or maintain three separate branches each with a different committed
`vercel.json` and connect each Vercel project to its own branch.

### Option B — mirror the Render setup (recommended for consistency)

Deploy the same single React build to three Vercel projects and let
`RestoContext.jsx`'s hostname detection route each one, exactly like the Render setup above.
This sidesteps the git-push gotcha entirely, since all three projects use the identical
config and content.

1. Replace the root `vercel.json` with:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   (this is the same content as the existing `vercel.pos.json`)
2. Create three Vercel projects from this repo/branch, named `pos-dashboard`,
   `kds-dashboard`, and `captive-portal` (Vercel's production alias is
   `https://<project-name>.vercel.app`, which contains those same strings the app checks
   for — matching how the Render service names work).
3. On each project, set **Framework Preset** to Vite (usually auto-detected), and add
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` under **Settings → Environment Variables**
   for the Production environment.
4. Push to the connected branch (or click **Deploy**) — all three build and deploy
   automatically on every push from here on.

---

## Quick reference: what each screen needs to work

- All three talk to the **same** Supabase project — use the same `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` pair everywhere.
- Row Level Security should be enabled and correctly scoped on every Supabase table, since
  the anon/publishable key is public by design — anyone can see it in the built JS bundle on
  any of these deployments.
- Local development: `npm install`, copy `.env.example` to `.env` and fill in your Supabase
  values, then `npm run dev`. Visiting `localhost` locally falls through to the admin
  dashboard by default (none of the hostname checks match `localhost`); append
  `?tab=kds` or `?tab=captive_portal` to the URL to preview the other two screens without
  deploying.
