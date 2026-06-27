
-- 1. Add moderator to participant_role enum (no-op if already present)
ALTER TYPE public.participant_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. Helper: is the user a host or moderator of the given room?
CREATE OR REPLACE FUNCTION public.is_room_moderator(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = _room_id AND r.host_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = _room_id
      AND rp.user_id = _user_id
      AND rp.role::text IN ('host','moderator')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_room_moderator(uuid, uuid) TO authenticated;

-- 3. Replace participant update/delete policies to include moderators
DROP POLICY IF EXISTS "User or host updates participant" ON public.room_participants;
CREATE POLICY "User host or moderator updates participant"
ON public.room_participants
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_room_moderator(room_id, auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_room_moderator(room_id, auth.uid())
);

DROP POLICY IF EXISTS "User or host removes participant" ON public.room_participants;
CREATE POLICY "User host or moderator removes participant"
ON public.room_participants
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_room_moderator(room_id, auth.uid())
);

-- 4. When host leaves (their participant row deleted), tear down the room
CREATE OR REPLACE FUNCTION public.handle_host_leave()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role::text = 'host' THEN
    DELETE FROM public.room_reactions  WHERE room_id = OLD.room_id;
    DELETE FROM public.room_messages   WHERE room_id = OLD.room_id;
    DELETE FROM public.room_participants WHERE room_id = OLD.room_id;
    DELETE FROM public.rooms           WHERE id      = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_host_leave ON public.room_participants;
CREATE TRIGGER trg_handle_host_leave
AFTER DELETE ON public.room_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_host_leave();

REVOKE EXECUTE ON FUNCTION public.handle_host_leave() FROM PUBLIC, anon, authenticated;
