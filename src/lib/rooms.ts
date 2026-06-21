import { supabase } from "@/integrations/supabase/client";

export interface Room {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  topic: string | null;
  skill_level: string | null;
  language: string | null;
  max_participants: number;
  is_private: boolean;
  password: string | null;
  livekit_room: string;
  status: "active" | "locked" | "ended";
  cover_gradient: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: "host" | "speaker" | "listener";
  hand_raised: boolean;
  joined_at: string;
}

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-amber-500 to-rose-500",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-fuchsia-600",
  "from-pink-500 to-orange-500",
  "from-cyan-500 to-blue-600",
];

export interface CreateRoomInput {
  title: string;
  description?: string;
  topic?: string;
  skill_level?: string;
  language?: string;
  max_participants?: number;
  is_private?: boolean;
  password?: string;
}

export async function createRoom(input: CreateRoomInput, hostId: string) {
  const livekit_room = `room_${crypto.randomUUID().slice(0, 12)}`;
  const cover_gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      ...input,
      host_id: hostId,
      livekit_room,
      cover_gradient,
      max_participants: input.max_participants ?? 50,
      is_private: input.is_private ?? false,
      password: input.is_private ? input.password ?? null : null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Room;
}

export async function listActiveRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .neq("status", "ended")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Room[];
}

export async function getRoom(id: string) {
  const { data, error } = await supabase.from("rooms").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Room | null;
}

export async function listParticipants(roomId: string) {
  const { data, error } = await supabase
    .from("room_participants")
    .select("*")
    .eq("room_id", roomId);
  if (error) throw error;
  return (data ?? []) as unknown as RoomParticipant[];
}
