-- ============================================================
-- SkillLoom Morocco — full schema for a self-owned Supabase project
-- Run this ONCE in: Supabase Dashboard > SQL Editor > New query
-- It is additive only. It never drops or resets anything.
-- ============================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.profile_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.room_status AS ENUM ('active', 'locked', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.participant_role AS ENUM ('host', 'speaker', 'listener', 'moderator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- SHARED FUNCTIONS ----------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.protect_profile_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (auth.jwt() ->> 'email') = 'makolabdo@gmail.com' THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.rejection_reason := OLD.rejection_reason;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  gender TEXT,
  date_of_birth DATE,
  city TEXT,
  country TEXT DEFAULT 'Morocco',
  phone_number TEXT,
  gmail TEXT,
  professional_title TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  languages TEXT[] DEFAULT '{}',
  education TEXT,
  occupation TEXT,
  linkedin TEXT,
  portfolio TEXT,
  interests TEXT[] DEFAULT '{}',
  learning_goals TEXT,
  teaching_interests TEXT,
  cin_url TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  status public.profile_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin reads all profiles" ON public.profiles;
CREATE POLICY "Admin reads all profiles" ON public.profiles
  FOR SELECT TO authenticated USING ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admin updates all profiles" ON public.profiles;
CREATE POLICY "Admin updates all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

DROP TRIGGER IF EXISTS profiles_protect_status ON public.profiles;
CREATE TRIGGER profiles_protect_status BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_status();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Safe public projection of an approved member (used by "View profile" in rooms)
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(id uuid, first_name text, last_name text, username text, avatar_url text,
  professional_title text, bio text, skills text[], experience text, languages text[],
  education text, occupation text, interests text[], learning_goals text,
  teaching_interests text, city text, country text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url,
         p.professional_title, p.bio, p.skills, p.experience, p.languages,
         p.education, p.occupation, p.interests, p.learning_goals,
         p.teaching_interests, p.city, p.country
  FROM public.profiles p
  WHERE p.id = _user_id AND p.status = 'approved';
$$;

-- ---------- ROOMS ----------
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  topic text,
  skill_level text,
  language text,
  max_participants int NOT NULL DEFAULT 50,
  is_private boolean NOT NULL DEFAULT false,
  password text,
  livekit_room text NOT NULL UNIQUE,
  status public.room_status NOT NULL DEFAULT 'active',
  cover_gradient text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read rooms" ON public.rooms;
CREATE POLICY "Authenticated read rooms" ON public.rooms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated create rooms" ON public.rooms;
CREATE POLICY "Authenticated create rooms" ON public.rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Host updates own room" ON public.rooms;
CREATE POLICY "Host updates own room" ON public.rooms
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id OR (auth.jwt() ->> 'email') = 'makolabdo@gmail.com')
  WITH CHECK (auth.uid() = host_id OR (auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

DROP POLICY IF EXISTS "Host deletes own room" ON public.rooms;
CREATE POLICY "Host deletes own room" ON public.rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id OR (auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON public.rooms;
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- ROOM PARTICIPANTS ----------
CREATE TABLE IF NOT EXISTS public.room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.participant_role NOT NULL DEFAULT 'listener',
  hand_raised boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_participants TO authenticated;
GRANT ALL ON public.room_participants TO service_role;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_moderator(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rooms r WHERE r.id = _room_id AND r.host_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = _room_id AND rp.user_id = _user_id
      AND rp.role::text IN ('host','moderator')
  );
$$;

DROP POLICY IF EXISTS "Authenticated read participants" ON public.room_participants;
CREATE POLICY "Authenticated read participants" ON public.room_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "User inserts self as participant" ON public.room_participants;
CREATE POLICY "User inserts self as participant" ON public.room_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User host or moderator updates participant" ON public.room_participants;
CREATE POLICY "User host or moderator updates participant" ON public.room_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_room_moderator(room_id, auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_room_moderator(room_id, auth.uid()));

DROP POLICY IF EXISTS "User host or moderator removes participant" ON public.room_participants;
CREATE POLICY "User host or moderator removes participant" ON public.room_participants
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_room_moderator(room_id, auth.uid()));

DROP TRIGGER IF EXISTS trg_participants_updated_at ON public.room_participants;
CREATE TRIGGER trg_participants_updated_at BEFORE UPDATE ON public.room_participants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- ROOM MESSAGES ----------
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room participants read messages" ON public.room_messages;
CREATE POLICY "Room participants read messages" ON public.room_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.room_participants rp
            WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.rooms r
               WHERE r.id = room_messages.room_id AND r.host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Room participants create own messages" ON public.room_messages;
CREATE POLICY "Room participants create own messages" ON public.room_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users edit own room messages" ON public.room_messages;
CREATE POLICY "Users edit own room messages" ON public.room_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users or hosts delete room messages" ON public.room_messages;
CREATE POLICY "Users or hosts delete room messages" ON public.room_messages
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.rooms r
               WHERE r.id = room_messages.room_id AND r.host_id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_room_messages_updated_at ON public.room_messages;
CREATE TRIGGER trg_room_messages_updated_at BEFORE UPDATE ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- ROOM REACTIONS ----------
CREATE TABLE IF NOT EXISTS public.room_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.room_reactions TO authenticated;
GRANT ALL ON public.room_reactions TO service_role;
ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read reactions" ON public.room_reactions;
CREATE POLICY "Participants can read reactions" ON public.room_reactions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.room_participants rp
            WHERE rp.room_id = room_reactions.room_id AND rp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.rooms r
               WHERE r.id = room_reactions.room_id AND r.host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Participants can send reactions" ON public.room_reactions;
CREATE POLICY "Participants can send reactions" ON public.room_reactions
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.room_participants rp
              WHERE rp.room_id = room_reactions.room_id AND rp.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.rooms r
                 WHERE r.id = room_reactions.room_id AND r.host_id = auth.uid())
    )
  );

-- ---------- ROOM LIFECYCLE TRIGGERS ----------
CREATE OR REPLACE FUNCTION public.cleanup_empty_room()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = OLD.room_id) THEN
    DELETE FROM public.room_reactions WHERE room_id = OLD.room_id;
    DELETE FROM public.room_messages  WHERE room_id = OLD.room_id;
    DELETE FROM public.rooms          WHERE id      = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_host_leave()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role::text = 'host' THEN
    DELETE FROM public.room_reactions    WHERE room_id = OLD.room_id;
    DELETE FROM public.room_messages     WHERE room_id = OLD.room_id;
    DELETE FROM public.room_participants WHERE room_id = OLD.room_id;
    DELETE FROM public.rooms             WHERE id      = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_empty_room ON public.room_participants;
CREATE TRIGGER trg_cleanup_empty_room AFTER DELETE ON public.room_participants
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_empty_room();

DROP TRIGGER IF EXISTS trg_handle_host_leave ON public.room_participants;
CREATE TRIGGER trg_handle_host_leave AFTER DELETE ON public.room_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_host_leave();

-- ---------- ADMIN AUDIT LOGS ----------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Read-only for the admin; writes happen only through the service role.
GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can view audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

-- ---------- FUNCTION EXECUTE HARDENING ----------
REVOKE EXECUTE ON FUNCTION public.protect_profile_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_empty_room() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_host_leave() FROM PUBLIC, anon, authenticated;

-- ---------- REALTIME ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['rooms','room_participants','room_messages','room_reactions'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ---------- STORAGE BUCKETS (both PRIVATE) ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cins', 'cins', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: readable by signed-in members, writable only inside own uid folder
DROP POLICY IF EXISTS "Avatars readable by members" ON storage.objects;
CREATE POLICY "Avatars readable by members" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CIN documents: strictly owner + site admin. Never public.
DROP POLICY IF EXISTS "Users read own cin" ON storage.objects;
CREATE POLICY "Users read own cin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cins' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Admin reads all cins" ON storage.objects;
CREATE POLICY "Admin reads all cins" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cins' AND (auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

DROP POLICY IF EXISTS "Users upload own cin" ON storage.objects;
CREATE POLICY "Users upload own cin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cins' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own cin" ON storage.objects;
CREATE POLICY "Users update own cin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cins' AND (storage.foldername(name))[1] = auth.uid()::text);
