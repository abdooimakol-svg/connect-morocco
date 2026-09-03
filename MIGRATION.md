# SkillLoom — backend is Lovable Cloud

The app's backend (auth, database, realtime, storage) is **Lovable Cloud**.
No external backend project is referenced anywhere in `src/`.

## How the app connects

`src/integrations/supabase/client.ts` is the only place a client is created
(the folder name is just how Lovable Cloud generates its client). It reads the
Cloud connection values that Lovable injects automatically:

- browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

In the Lovable preview and on the Lovable-published site these are provided by
Lovable Cloud — nothing to configure.

## Authentication

Email + password only (`signInWithPassword`, `signUp`, `resetPasswordForEmail`
→ `/reset-password`, `signOut`). There is **no** Google/OAuth code anywhere in
`src/` and no `/auth/callback` route.

Admin authorization is enforced in the database, not the UI: access rules on
`profiles`, `rooms`, `admin_audit_logs` and the `protect_profile_status()`
trigger all check `auth.jwt() ->> 'email' = 'makolabdo@gmail.com'`.

## Features running on Lovable Cloud

Auth, profiles and approval statuses, rooms (create / terminate), participants,
messages, reactions, realtime on all four room tables, admin audit logs, admin
user deletion, and the `avatars` / `cins` storage buckets.

Voice audio itself runs on LiveKit Cloud; the tokens are minted server-side
from `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

## Deployment

Publish from Lovable — the Cloud backend is wired automatically, including the
admin **Delete user** action, which needs the server-only service key.

Self-hosting elsewhere (e.g. Netlify) is possible but requires copying the
connection values manually, and the service key is not exposed outside Lovable,
so admin user deletion only works on the Lovable-published site. Never put a
service key or the LiveKit secret in a `VITE_*` variable.
