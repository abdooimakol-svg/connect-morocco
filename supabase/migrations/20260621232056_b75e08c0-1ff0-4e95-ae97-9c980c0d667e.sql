
-- Enums
CREATE TYPE public.room_status AS ENUM ('active', 'locked', 'ended');
CREATE TYPE public.participant_role AS ENUM ('host', 'speaker', 'listener');

-- Rooms
CREATE TABLE public.rooms (
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

CREATE POLICY "Authenticated read rooms" ON public.rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated create rooms" ON public.rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host updates own room" ON public.rooms
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id OR (auth.jwt() ->> 'email') = 'makolabdo@gmail.com')
  WITH CHECK (auth.uid() = host_id OR (auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

CREATE POLICY "Host deletes own room" ON public.rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id OR (auth.jwt() ->> 'email') = 'makolabdo@gmail.com');

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Participants
CREATE TABLE public.room_participants (
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

CREATE POLICY "Authenticated read participants" ON public.room_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "User inserts self as participant" ON public.room_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User or host updates participant" ON public.room_participants
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
  );

CREATE POLICY "User or host removes participant" ON public.room_participants
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
  );

CREATE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON public.room_participants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
