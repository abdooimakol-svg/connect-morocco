import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  roomName: z.string().min(1),
  canPublish: z.boolean().default(false),
});

const HostActionSchema = z.object({
  roomName: z.string().min(1),
  targetIdentity: z.string().min(1).optional(),
});

function missingLivekitVars() {
  return (["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"] as const).filter(
    (name) => !process.env[name],
  );
}

function livekitConfigError() {
  const missing = missingLivekitVars();
  // Names only — never the values.
  return new Error(
    `Voice service not configured on this deployment. Missing server environment variable(s): ${missing.join(", ")}`,
  );
}

function livekitApiUrl() {
  const url = process.env.LIVEKIT_URL;
  if (!url) throw livekitConfigError();
  return url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

async function createRoomService() {
  const { RoomServiceClient } = await import("livekit-server-sdk");
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw livekitConfigError();
  return new RoomServiceClient(livekitApiUrl(), apiKey, apiSecret);
}

// Voice-server side effects are best-effort: if the deployment has no LiveKit
// credentials (or the room is not live), moderation must still succeed in the
// database instead of failing the whole action.
async function bestEffort(run: () => Promise<void>) {
  try {
    await run();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : "Voice action skipped" };
  }
}

async function assertRoomHost(supabase: typeof import("@/integrations/supabase/client").supabase, userId: string, roomName: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id,host_id,livekit_room")
    .eq("livekit_room", roomName)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.host_id !== userId) throw new Error("Only the room host can do this");
  return data;
}

async function assertRoomModerator(supabase: typeof import("@/integrations/supabase/client").supabase, userId: string, roomName: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id,host_id,livekit_room")
    .eq("livekit_room", roomName)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Room not found");
  if (data.host_id === userId) return data;
  const { data: me } = await supabase
    .from("room_participants")
    .select("role")
    .eq("room_id", data.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!me || (me as { role: string }).role !== "moderator") {
    throw new Error("Only the host or a moderator can do this");
  }
  return data;
}


export const getLivekitToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { AccessToken } = await import("livekit-server-sdk");
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !url) {
      throw livekitConfigError();
    }

    // identity = user id, name = display
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("first_name,last_name,username,avatar_url")
      .eq("id", context.userId)
      .maybeSingle();

    const displayName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.username ||
      "Member";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: context.userId,
      name: displayName,
      metadata: JSON.stringify({ avatar_url: profile?.avatar_url ?? null }),
    });
    at.addGrant({
      room: data.roomName,
      roomJoin: true,
      canPublish: data.canPublish,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return { token, url };
  });

export const promoteLivekitParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => HostActionSchema.required({ targetIdentity: true }).parse(input))
  .handler(async ({ data, context }) => {
    await assertRoomModerator(context.supabase, context.userId, data.roomName);
    return bestEffort(async () => {
      const svc = await createRoomService();
      await svc.updateParticipant(data.roomName, data.targetIdentity!, {
        permission: {
          canSubscribe: true,
          canPublish: true,
          canPublishData: true,
          canPublishSources: [2],
        },
      });
    });
  });

export const muteLivekitParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => HostActionSchema.required({ targetIdentity: true }).parse(input))
  .handler(async ({ data, context }) => {
    await assertRoomModerator(context.supabase, context.userId, data.roomName);
    return bestEffort(async () => {
      const svc = await createRoomService();
      const participant = await svc.getParticipant(data.roomName, data.targetIdentity!);
      const micTrack = participant.tracks.find((track) => track.source === 2);
      if (!micTrack) throw new Error("Participant has no active microphone");
      await svc.mutePublishedTrack(data.roomName, data.targetIdentity!, micTrack.sid, true);
    });
  });

export const removeLivekitParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => HostActionSchema.required({ targetIdentity: true }).parse(input))
  .handler(async ({ data, context }) => {
    await assertRoomModerator(context.supabase, context.userId, data.roomName);
    return bestEffort(async () => {
      const svc = await createRoomService();
      await svc.removeParticipant(data.roomName, data.targetIdentity!);
    });
  });

export const deleteLivekitRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => HostActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertRoomHost(context.supabase, context.userId, data.roomName);
    return bestEffort(async () => {
      const svc = await createRoomService();
      await svc.deleteRoom(data.roomName);
    });
  });
