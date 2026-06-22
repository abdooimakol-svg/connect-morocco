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

CREATE POLICY "Room participants read messages"
ON public.room_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = room_messages.room_id
      AND rp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_messages.room_id
      AND r.host_id = auth.uid()
  )
);

CREATE POLICY "Room participants create own messages"
ON public.room_messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = room_messages.room_id
      AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "Users edit own room messages"
ON public.room_messages
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or hosts delete room messages"
ON public.room_messages
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_messages.room_id
      AND r.host_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS trg_room_messages_updated_at ON public.room_messages;
CREATE TRIGGER trg_room_messages_updated_at
  BEFORE UPDATE ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS room_messages_room_created_idx
ON public.room_messages (room_id, created_at DESC);