CREATE TABLE public.room_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX room_reactions_room_id_created_at_idx ON public.room_reactions(room_id, created_at DESC);

GRANT SELECT, INSERT ON public.room_reactions TO authenticated;
GRANT ALL ON public.room_reactions TO service_role;

ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read reactions"
ON public.room_reactions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.room_participants rp WHERE rp.room_id = room_reactions.room_id AND rp.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_reactions.room_id AND r.host_id = auth.uid())
);

CREATE POLICY "Participants can send reactions"
ON public.room_reactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.room_participants rp WHERE rp.room_id = room_reactions.room_id AND rp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_reactions.room_id AND r.host_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_reactions;