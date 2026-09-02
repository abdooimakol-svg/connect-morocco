# SkillLoom — backend is Lovable Cloud

The app's backend (auth, database, realtime, storage) is **Lovable Cloud**.
The external Supabase project (`vlirkfqljiijsktqimfs`) is no longer used by the
code and was **not** deleted or modified — it stays as a read-only backup.

## How the app picks its backend

`src/integrations/supabase/client.ts` is the only place a client is created. It
reads, in order:

- browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- SSR fallback: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`

So the backend is chosen entirely by environment variables — no code change is
needed to switch. In Lovable (preview and published site) these are injected
automatically and point at Lovable Cloud.

## Authentication

Email + password only (`signInWithPassword`, `signUp`, `resetPasswordForEmail`
→ `/reset-password`, `signOut`). There is **no** Google/OAuth code anywhere in
`src/` and no `/auth/callback` route.

Admin authorization is enforced in the database, not the UI: RLS policies on
`profiles`, `rooms`, `admin_audit_logs` and the `protect_profile_status()`
trigger all check `auth.jwt() ->> 'email' = 'makolabdo@gmail.com'`.

## Data state in Lovable Cloud (verified)

| Table | Rows |
| --- | --- |
| auth users / profiles | 12 |
| rooms | 2 |
| room_participants | 2 |
| room_messages | 0 |
| room_reactions | 0 |
| admin_audit_logs | 6 |
| storage `avatars` | 12 files |
| storage `cins` | 8 files |

The two accounts that had only ever existed in the external project
(`jsbhjjwbb@gmail.com`, `lmdcarrosserie3@gmail.com`) were re-created in Lovable
Cloud with their profile data and `pending` status. They have no password yet —
they must use **Forgot password** once.

Realtime is enabled for `rooms`, `room_participants`, `room_messages`,
`room_reactions`.

## Netlify (`skillloom.netlify.app`)

To make the Netlify deployment use Lovable Cloud, replace the external Supabase
variables in **Netlify → Site settings → Environment variables** with:

```
VITE_SUPABASE_URL             = https://kvqhltxxrrzsfqmazksv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cWhsdHh4cnJ6c2ZxbWF6a3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjg1ODIsImV4cCI6MjA5NzY0NDU4Mn0.ht8EZlsRxk7zK0UP2WY1O6e5OWCWa3HEcrszSewE5uE
SUPABASE_URL                  = https://kvqhltxxrrzsfqmazksv.supabase.co
SUPABASE_PUBLISHABLE_KEY      = <same publishable key as above>
LIVEKIT_URL                   = wss://voice-lrfg0xx7.livekit.cloud
LIVEKIT_API_KEY               = APIoXc8FjZhoxmo
LIVEKIT_API_SECRET            = <your LiveKit secret>
```

Then **Deploys → Trigger deploy → Clear cache and deploy site** (the `VITE_*`
values are baked in at build time; a redeploy without a rebuild keeps the old
backend).

Also add `https://skillloom.netlify.app/**` to the allowed redirect URLs of the
Lovable Cloud auth settings so password-reset links return to Netlify.

### One limitation on Netlify

The admin **Delete user** action (`src/lib/admin.functions.ts`) needs
`SUPABASE_SERVICE_ROLE_KEY`. Lovable Cloud does not expose its service-role key,
so that single action cannot run on Netlify. Everything else — login, register,
logout, password reset, profiles, approve/reject, rooms, participants, messages,
reactions, realtime, storage, LiveKit — works with the publishable key.

Use the Lovable-published site (`https://skillloom.lovable.app`) if you need
admin user deletion; there the key is injected automatically.
Never put the service-role key, a database password, or the LiveKit secret in a
`VITE_*` variable.
