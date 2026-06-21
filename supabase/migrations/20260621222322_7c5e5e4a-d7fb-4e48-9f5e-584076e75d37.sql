
-- Status enum
CREATE TYPE public.profile_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
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

-- Users read their own profile
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admin (single hardcoded email) can read all profiles
CREATE POLICY "Admin reads all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

-- Users insert their own profile
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users update their own profile (but cannot change status / rejection_reason — enforced by trigger)
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile (status changes)
CREATE POLICY "Admin updates all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

-- Prevent non-admin users from modifying status or rejection_reason
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

CREATE TRIGGER profiles_protect_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_status();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create empty profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies: avatars (public bucket) — users manage their own folder
CREATE POLICY "Avatars publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: cins (private bucket) — owner + admin
CREATE POLICY "Users read own cin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cins' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin reads all cins" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cins' AND (auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

CREATE POLICY "Users upload own cin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cins' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own cin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cins' AND (storage.foldername(name))[1] = auth.uid()::text);
