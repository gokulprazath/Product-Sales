# ExpenseTrack — React + Supabase

Migrated from vanilla HTML to React with Supabase backend.  
Live at: **https://gokulprazath.github.io/Product-Sales**

---

## What's Included

| Feature | Details |
|---|---|
| Login / Sign-up | Gmail address + password via Supabase Auth |
| Log Expense | Category, shop, date, multiple products |
| Decimal Quantities | e.g. 0.5 kg, 1.25 L |
| Lookup Product | Search across all your expenses |
| History | Stats strip, date range filter, search, delete |
| Export Excel | 3-sheet workbook (rows, by category, by shop) |
| Safe Deploy | Supabase data is never wiped on redeploy |

---

## Prerequisites

Install these once on your machine:

- [Node.js 18+](https://nodejs.org/) — check with `node -v`
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com) account (free)
- A [GitHub](https://github.com) account

---

## Step 1 — Set Up Supabase

1. Go to https://supabase.com → **New project**
2. Name it `product-sales`, choose a region, set a strong DB password → **Create project**
3. Wait ~2 min for it to provision
4. In the left sidebar → **SQL Editor** → click **New query**
5. Copy the entire contents of `supabase-schema.sql` and paste it → click **Run**
   - You should see: "Success. No rows returned"
6. Go to **Project Settings → API**
7. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## Step 2 — Set Up the Project Locally

Open a terminal (in VS Code: `Ctrl+` ` ` ` or Terminal → New Terminal):

```bash
# 1. Clone your GitHub repo
git clone https://github.com/gokulprazath/Product-Sales.git
cd Product-Sales

# 2. Copy all the project files from this zip/folder into the repo root
#    (replace any existing index.html)

# 3. Install dependencies
npm install

# 4. Create your local environment file
cp .env.example .env.local
```

Now open `.env.local` in VS Code and fill in your Supabase credentials:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key-here
```

> ⚠️ Never commit `.env.local` — it's already in `.gitignore`

---

## Step 3 — Run Locally

```bash
npm start
```

- Opens http://localhost:3000 automatically
- Sign up with your Gmail address → check email for confirmation link → log in
- Test all features before deploying

---

## Step 4 — Enable Email Confirmations (Optional but Recommended)

By default Supabase requires email confirmation. To disable it for testing:

1. Supabase dashboard → **Authentication → Providers → Email**
2. Toggle **"Confirm email"** OFF → Save
3. Now sign-up works instantly without email confirmation

---

## Step 5 — Deploy to GitHub Pages

### One-time GitHub setup

```bash
# Install gh-pages tool (already in devDependencies)
npm install

# Make sure your git remote is set
git remote -v
# Should show: origin https://github.com/gokulprazath/Product-Sales.git
```

### Add Supabase secrets to GitHub (so the build works)

1. Go to https://github.com/gokulprazath/Product-Sales → **Settings → Secrets and variables → Actions**
2. Click **New repository secret** and add:
   - Name: `REACT_APP_SUPABASE_URL`  Value: your Supabase URL
   - Name: `REACT_APP_SUPABASE_ANON_KEY`  Value: your anon key

### Deploy

```bash
npm run deploy
```

This command:
1. Runs `npm run build` — creates an optimised production build
2. Pushes the `build/` folder to the `gh-pages` branch of your repo

> ✅ **Your data is safe** — `npm run deploy` only pushes the compiled React app.  
> It never touches your Supabase database. All expense data lives in Supabase, not in the app files.

### Enable GitHub Pages

1. Go to https://github.com/gokulprazath/Product-Sales → **Settings → Pages**
2. Under **Branch** → select `gh-pages` → `/ (root)` → **Save**
3. Wait ~2 minutes → visit https://gokulprazath.github.io/Product-Sales

---

## Step 6 — Every Future Deploy

```bash
# Make your code changes, then:
npm run deploy
```

That's it. One command. Data is never affected.

---

## Supabase Auth — Allowed URLs

When deployed, add your GitHub Pages URL to Supabase allowed redirects:

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://gokulprazath.github.io/Product-Sales`
3. **Redirect URLs**: add `https://gokulprazath.github.io/Product-Sales`
4. Save

---

## Project Structure

```
Product-Sales/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js / Header.css
│   ├── contexts/
│   │   └── AuthContext.js          ← manages login state
│   ├── lib/
│   │   ├── supabase.js             ← Supabase client
│   │   ├── catColors.js            ← category colour map
│   │   └── exportExcel.js          ← Excel export logic
│   ├── pages/
│   │   ├── LoginPage.js / .css
│   │   ├── LogExpense.js / .css
│   │   ├── Lookup.js / .css
│   │   └── History.js / .css
│   ├── App.js / App.css
│   ├── index.js
│   └── index.css
├── supabase-schema.sql             ← run once in Supabase SQL editor
├── .env.example                    ← copy → .env.local
├── .gitignore
└── package.json
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing Supabase env vars` error | Check `.env.local` has both keys, restart `npm start` |
| Login says "Invalid login credentials" | Make sure you confirmed your email, or disable confirmation in Supabase |
| GitHub Pages shows blank page | Wait 2 min after deploy; check gh-pages branch exists |
| Data not showing after deploy | Data lives in Supabase — check your URL/key in GitHub Secrets |
| `qty` not accepting decimals | Use a dot: `0.5` not `0,5` |
| "Email not confirmed" error | Disable email confirmation in Supabase Auth settings (see Step 4) |

---

## Why Data Is Never Lost on Deploy

- All expense data is stored in **Supabase PostgreSQL** (cloud database)
- `npm run deploy` only uploads the compiled React JavaScript files to GitHub
- The database is completely separate from your GitHub repo
- Redeploying = updating the website code only, **never the database**
