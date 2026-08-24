# Migration: Lovable Cloud → your own Supabase project

Target project: `https://vlirkfqljiijsktqimfs.supabase.co`

Nothing in your existing Lovable Cloud project has been dropped, reset or deleted.
All steps below are additive.

---

## 0. ROTATE YOUR SECRET KEY FIRST

You pasted `sb_secret_...` into chat. Treat it as compromised.
Go to your Supabase project → **Project Settings → API Keys → Secret keys → Rotate**,
and use the new value everywhere below. Never put a secret key in front-end code
or commit it to Git.

---

## What changed in the code (done)

| Area | Before | After |
| --- | --- | --- |
| Google sign-in | `lovable.auth.signInWithOAuth` → `/~oauth/*` (Lovable-only, 404 on Netlify) | `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin + "/auth/callback" } })` |
| OAuth return | Lovable proxy | New route `/auth/callback` that waits for the Supabase session, then hands off to the existing `AuthGate` (onboarding → CIN → pending → approved/rejected) |
| Database / Auth / Storage / Realtime | Already plain `@supabase/supabase-js` via `src/integrations/supabase/client.ts` | Unchanged — it reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`, so pointing it at your project is purely an environment-variable change |
| LiveKit | TanStack server functions reading `LIVEKIT_*` from `process.env` | Unchanged. They never depended on Lovable Cloud; the API secret stays server-side |
| Admin delete-user | TanStack server function with `SUPABASE_SERVICE_ROLE_KEY` | Unchanged, server-side only |
| Netlify | no config | `netlify.toml` added (Nitro `netlify` preset, SSR) |

UI, routes, business logic, LiveKit and the approval workflow are untouched.

---

## Manual steps you must do (I cannot reach your Supabase project from here)

### 1. Create the schema

**Where:** your Supabase dashboard → **SQL Editor → New query**
**What:** paste the entire contents of `supabase/self-hosted/01_schema.sql` and run it.

It creates: enums (`profile_status`, `room_status`, `participant_role`), tables
(`profiles`, `rooms`, `room_participants`, `room_messages`, `room_reactions`,
`admin_audit_logs`), all foreign keys / unique constraints / defaults, the
functions (`handle_new_user`, `protect_profile_status`, `tg_set_updated_at`,
`is_room_moderator`, `get_public_profile`, `cleanup_empty_room`,
`handle_host_leave`), all triggers, all GRANTs, all RLS policies, the realtime
publication, and the two **private** storage buckets (`avatars`, `cins`) with
their owner-and-admin-only policies.

### 2. Enable the Google provider

**Where:** Supabase dashboard → **Authentication → Sign In / Providers → Google**
**What you need:** a Google Cloud OAuth 2.0 Client ID + Client Secret.
In Google Cloud Console → Credentials → your OAuth client, add this
**Authorized redirect URI**:

```
https://vlirkfqljiijsktqimfs.supabase.co/auth/v1/callback
```

### 3. Set the allowed redirect URLs

**Where:** Supabase dashboard → **Authentication → URL Configuration**

- Site URL: `https://helpful-douhua-0c7d96.netlify.app`
- Redirect URLs (add all):
  - `https://helpful-douhua-0c7d96.netlify.app/**`
  - `http://localhost:8080/**`

Without this, Google login and password-reset links will bounce.

### 4. Set Netlify environment variables

**Where:** Netlify → Site settings → **Environment variables**

Browser-visible:
```
VITE_SUPABASE_URL           = https://vlirkfqljiijsktqimfs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_4O7G32BItRUHgzqQmOKLxA_D076LhwN
```

Server-only (never with a `VITE_` prefix):
```
SUPABASE_URL                = https://vlirkfqljiijsktqimfs.supabase.co
SUPABASE_PUBLISHABLE_KEY    = sb_publishable_4O7G32BItRUHgzqQmOKLxA_D076LhwN
SUPABASE_SERVICE_ROLE_KEY   = <your NEW rotated secret key>
LIVEKIT_URL                 = wss://voice-lrfg0xx7.livekit.cloud
LIVEKIT_API_KEY             = APIoXc8FjZhoxmo
LIVEKIT_API_SECRET          = <your LiveKit secret>
```

### 5. Data migration (manual, non-destructive)

I cannot copy rows between the two projects. If you want to keep existing users
and content:

1. Auth users must move first — Supabase does not let you export password
   hashes from the dashboard. Practical options:
   - Ask members to sign up again (simplest; profiles are recreated by the
     `handle_new_user` trigger), **or**
   - Use the Supabase CLI / `pg_dump` on the `auth.users` table with your
     database password, then restore into the new project **before** importing
     `public.profiles`, because `profiles.id` references `auth.users(id)`.
2. Then export/import in this order (dashboard → Table Editor → Export CSV, or
   `pg_dump --data-only -t public.<table>`):
   `profiles` → `rooms` → `room_participants` → `room_messages` → `room_reactions` → `admin_audit_logs`
3. Storage files (`avatars/`, `cins/`) must be downloaded and re-uploaded with
   identical object paths (`<user-id>/<filename>`), otherwise `avatar_url` and
   `cin_url` will point at nothing.

Rooms and participants are ephemeral by design — skipping them is usually fine.

### 6. Deploy

Netlify build command `npm run build`, publish dir `dist`, with
`NITRO_PRESET=netlify` (already in `netlify.toml`). SSR routing is handled by
the Nitro Netlify adapter, so no `_redirects` SPA rule is needed — adding one
would break the server endpoints.

---

## Verification checklist after deploy

- Email register / login / logout / password reset (`/reset-password`)
- Google login → lands on `/auth/callback` → onboarding or Home per status
- Complete profile + avatar upload + CIN upload (CIN must stay private)
- Pending → admin approve/reject → approved user reaches Home
- Admin at `makolabdo@gmail.com`: list users, view CIN, approve, reject, delete, audit log
- Create/join/leave room, host & moderator controls, raise hand, remove participant
- LiveKit: join voice, mic, mute/unmute, speaker/listener
- Realtime: participants, messages, reactions, room deletion — no refresh needed

---

## Remaining Lovable references

None. `src/integrations/lovable/` and the `@lovable.dev/cloud-auth-js`
dependency were deleted. Authentication runs entirely through
`supabase.auth` (email/password, password reset, and
`signInWithOAuth({ provider: "google", redirectTo: origin + "/auth/callback" })`).

### Auth configuration required in the target Supabase project

- Auth > URL Configuration > Site URL: `https://skillloom.lovable.app`
- Redirect URLs: `https://skillloom.lovable.app/auth/callback`,
  plus your Netlify domain `/auth/callback` and `http://localhost:8080/auth/callback`.
- Auth > Providers > Google: enabled, with the Google Cloud OAuth client's
  Authorized redirect URI set to
  `https://vlirkfqljiijsktqimfs.supabase.co/auth/v1/callback`.

## Migration executed (verified)

Target project: `vlirkfqljiijsktqimfs`

- Schema applied from `supabase/self-hosted/01_schema.sql`: 6 tables, 3 enums, 7 functions, all triggers, 20 RLS policies.
- Storage buckets `avatars` and `cins` created (both private) with owner/admin policies.
- Realtime publication enabled for `rooms`, `room_participants`, `room_messages`, `room_reactions`.
- Accounts copied with original UUIDs: 9 users (+ email identities).
- Rows copied: profiles 9, rooms 2, room_participants 2, room_messages 0, room_reactions 0, admin_audit_logs 6.

### Remaining manual steps
1. Password hashes cannot be exported from the source project — existing members must use
   "Forgot password" (or Google sign-in) once on the new project.
2. Storage files (avatars, CIN scans) were not copied; the buckets are empty. Users can re-upload,
   or provide the target project's secret key to run a file copy.
3. In Netlify, set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (target project) plus the LiveKit vars.
4. In the target project's auth settings, enable Google and add the redirect URL
   `https://<your-netlify-domain>/auth/callback`.
