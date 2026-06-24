CREATE OR REPLACE FUNCTION public.cleanup_empty_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.room_participants WHERE room_id = OLD.room_id
  ) THEN
    DELETE FROM public.room_reactions WHERE room_id = OLD.room_id;
    DELETE FROM public.room_messages  WHERE room_id = OLD.room_id;
    DELETE FROM public.rooms          WHERE id      = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_empty_room ON public.room_participants;
CREATE TRIGGER trg_cleanup_empty_room
AFTER DELETE ON public.room_participants
FOR EACH ROW EXECUTE FUNCTION public.cleanup_empty_room();