# Supabase New Project Setup

Use this when moving from the old (inactive) project to a new Supabase project. It covers **where the URL is used** and **every table/bucket you need** in the new project.

---

## 1. Where the app fetches (auth / API)

- **Auth token refresh** (the failing request you see in the console) is done by the **Supabase JS client** in the browser. The client is created in **`src/supabaseClient.ts`** using:
  - `import.meta.env.VITE_SUPABASE_URL`
  - `import.meta.env.VITE_SUPABASE_ANON_KEY`
- All other Supabase calls (tables, storage, auth) use that same client, so they all go to whatever URL/key are in that file (from env at **build time** for production).

So: **there is no other “fetch URL” to change in code.** You only need to ensure the **new** project URL and anon key are set in the right places (see below).

---

## 2. Where to set the new Supabase URL

### Local development

| Location | Variables | Notes |
|----------|-----------|--------|
| **Root `.env.local`** (or `.env`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend (Vite) reads these. Backend also reads root `.env`/`.env.local` for server-side vars. |
| Same file | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Backend and scripts. |

You already have the new URL in `.env.local` for the frontend. Ensure **backend** gets it too: either in the same root `.env.local` (backend loads it) or in `backend/.env`.

### Live / production app (e.g. Vercel)

The **live** app is a **built** bundle. The Supabase URL and anon key are **baked in at build time** from **environment variables** in your hosting platform.

1. In your host (e.g. **Vercel**): **Project → Settings → Environment Variables** add:
   - `VITE_SUPABASE_URL` = `https://YOUR_NEW_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your new project’s **anon** key  
   (Same values as in `.env.local` for the new project.)
2. **Redeploy** the frontend (e.g. “Redeploy” in Vercel) so a **new build** runs with these variables.  
   Until you redeploy, the old build (and thus the old URL) is still what runs, which is why you still see requests to `xipjxcktpzanmhfrkbrm.supabase.co`.

### Backend (Railway / other)

- Set **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** in the backend’s environment (e.g. Railway env vars) to the **new** project.
- No code change needed; the backend uses `backend/src/config/database.js`, which reads `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.

### Other places that may still reference the old URL (optional cleanup)

- **`backend/.env`** – use new project URL/keys or leave unset and rely on deployment env.
- **`auto-apply/.env`** – same; set `SUPABASE_URL` (and key) for the new project if you run that worker.
- **`deploy-edge-functions.md`** – update example URLs to the new project.
- **Supabase Edge Functions** – if you deploy them, set the **`SUPABASE_URL`** (and `SUPABASE_SERVICE_ROLE_KEY`) secrets in the new project’s Edge Function secrets.

---

## 3. Tables to implement in the new project

Create these in the **new** Supabase project (SQL Editor or migrations). The repo already has `.sql` files you can run; below is the list and the files to use where they exist.

### Core (auth-related)

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **profiles** | User profile (onboarding, resume, location, notifications, etc.) | Created by Supabase Auth + `update_profiles_table.sql`, `add_onboarding_complete_field.sql`, `add_lat_lng.sql`, `add_notification_privacy_settings.sql`, `add_updated_at_to_profiles.sql`, `enable_profiles_rls.sql` (or `resume_storage_schema.sql` for profile columns). |

Supabase often creates a **profiles** table via a trigger on `auth.users`; if not, create it with at least `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` and add columns from the alter scripts above (e.g. `onboarding_complete`, `resume_url`, `latitude`, `longitude`, `auto_applies_used_today`, `auto_apply_usage_date`, `notification_settings`, `privacy_settings`, etc.).

### Jobs and swipes

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **job_swipes** | User swipes/saves on jobs (API jobs) | `create_job_swipes_table.sql`, `database_schema.sql`, `add_raw_job_column.sql`, `update_job_swipes_foreign_key.sql` |
| **linkedin_fetched_jobs** | LinkedIn-fetched job listings per user | `create_linkedin_fetched_jobs_table.sql`, `add_description_column.sql`, `add_job_title_company_columns.sql`, `add_raw_job_column.sql` (if applicable) |
| **job_applications** | Applications to employer-created jobs | `create_job_applications_table.sql`, `database_schema.sql`, `create_job_applications_table.sql`, `add_application_tracking_columns.sql` (if exists) |

### Employer

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **employers** | Employer accounts (contact_email, etc.) | Referenced in code; no standalone create file in list – create with `id UUID PRIMARY KEY REFERENCES auth.users(id)`, `contact_email`, etc. |
| **jobs** | Employer-created job listings | `database_schema.sql` |
| **employer_job_stats** | Aggregated stats per job (views, applications, saves) | See SQL below. |

### User data and tracking

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **education** | User education entries | `education_experience_schema.sql` |
| **experience** | User work experience | `education_experience_schema.sql` |
| **user_daily_tracking** | Daily auto-apply usage and streaks | See SQL below. |

### LinkedIn and resumes

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **linkedin_credentials** | Encrypted LinkedIn login (backend) | `create_linkedin_credentials_table.sql` |
| **resume_uploads** | Resume upload metadata | `resume_storage_schema.sql` |
| **resume_parsing_results** | Parsed resume data | `resume_storage_schema.sql` |

Note: Code also references a **`resumes`** table in some places (e.g. `resumeUpload.ts`); the main storage is the **Storage bucket** `resumes`. Ensure either a small `resumes` table exists for metadata or that all resume metadata lives in `resume_uploads`/`profiles` and update code if needed.

### Roadmaps (profile roadmap feature)

| Table | Purpose | Inferred columns |
|-------|---------|-------------------|
| **roadmap_nodes** | Individual roadmap nodes | `id`, `user_id`, `name`, `description`, `node_date`, `node_type`, `status`, `mode`, `branch_from`, `x`, `y` |
| **roadmaps** | Snapshot of full roadmap per user | `user_id` (unique), `data` (JSONB) |

RLS: `enable_rls_policies.sql` has examples for `roadmaps` and `roadmap_nodes`.

### Payments / subscriptions

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **user_subscriptions** | Stripe subscription state per user | `subscription_schema.sql` |
| **subscriptions** | Backend payment service uses **`subscriptions`** in code | `backend/src/services/paymentService.js` uses `.from('subscriptions')`. Either create a table named **`subscriptions`** with columns used there (e.g. `stripe_subscription_id`, `stripe_customer_id`, `status`, `current_period_start`, `current_period_end`, `trial_start`, `trial_end`, `price_id`, `quantity`, `metadata`, `canceled_at`) or add a view/alias so `subscriptions` points to `user_subscriptions` and column names match. |
| **payment_history** | Payment history | `subscription_schema.sql` |
| **subscription_plans** | Plan definitions | `subscription_schema.sql` |
| **free_trials** | Free trial tracking | `subscription_schema.sql` |

### Optional / extra

| Table | Purpose | Schema / file |
|-------|---------|----------------|
| **user_essential_questions** | User essential questions | `database_schema.sql` |
| **employer_essential_questions** | Employer essential questions | `database_schema.sql` |
| **user_additional_questions** | Additional questions | `create_user_additional_questions_table.sql` |
| **email_notifications** | Email notification prefs/log | `email_notifications_schema.sql` |
| **worker_messages** | Worker messages | `create_worker_messages_table.sql` |
| **subscription_audit_log** | Subscription audit | `subscription_rls_policies.sql` |

Run the RLS and policy scripts (e.g. `enable_rls_policies.sql`, `subscription_rls_policies.sql`, `enable_profiles_rls.sql`) as needed for the new project.

---

## 4. Storage bucket

| Bucket | Purpose |
|--------|--------|
| **resumes** | User resume file uploads. Create in Supabase Dashboard → Storage; set RLS/policies (e.g. `storage_bucket_policies.sql`, `simple_storage_policy.sql`, `resume_storage_schema.sql`). |

---

## 5. Order of operations

1. **Create the new Supabase project** and get URL + anon key + service_role key.
2. **Set env vars** for local (`.env.local`) and for **production** (Vercel/env): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; for backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. **Redeploy the live frontend** so the new build uses the new URL (fixes “fetch credentials” / token refresh to the old URL).
4. **Run the SQL** in the new project to create tables (and optional views) and storage bucket/policies.
5. **Re-run any migrations** (e.g. add columns) that your app expects.
6. Optionally **deploy Edge Functions** (e.g. parse-resume, send-email) and set their secrets to the new project.

After that, the app should use the new project everywhere and stop calling the old inactive URL.

---

## 6. SQL for tables not in repo files

Run these in the new project’s SQL Editor if you don’t have migrations for them.

### user_daily_tracking

```sql
CREATE TABLE IF NOT EXISTS user_daily_tracking (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  auto_applies_used_today INTEGER DEFAULT 0,
  auto_apply_usage_date DATE,
  login_streak INTEGER DEFAULT 0,
  last_reward_claimed_date DATE,
  reward_bonus_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_user_daily_tracking_user_id ON user_daily_tracking(user_id);
ALTER TABLE user_daily_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tracking" ON user_daily_tracking FOR ALL USING (auth.uid() = user_id);
```

### employer_job_stats

(Run after `jobs` table exists.)

```sql
CREATE TABLE IF NOT EXISTS employer_job_stats (
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (job_id, stat_type)
);
CREATE INDEX IF NOT EXISTS idx_employer_job_stats_job_id ON employer_job_stats(job_id);
ALTER TABLE employer_job_stats ENABLE ROW LEVEL SECURITY;
-- Adjust policy so only employers can insert/update (e.g. using employer_id from jobs)
CREATE POLICY "Service role full access" ON employer_job_stats FOR ALL USING (true);
```

### roadmaps & roadmap_nodes (if not created elsewhere)

```sql
CREATE TABLE IF NOT EXISTS roadmaps (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  data JSONB
);
CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  node_date TEXT,
  node_type TEXT,
  status TEXT,
  mode TEXT,
  branch_from UUID REFERENCES roadmap_nodes(id) ON DELETE SET NULL,
  x FLOAT DEFAULT 200,
  y FLOAT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_user_id ON roadmap_nodes(user_id);
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own roadmaps" ON roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own roadmap_nodes" ON roadmap_nodes FOR ALL USING (auth.uid() = user_id);
```
