import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  roomName: z.string().min(1),
  canPublish: z.boolean().default(false),
});

export const getLivekitToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { AccessToken } = await import("livekit-server-sdk");
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !url) {
      throw new Error("LiveKit env vars not configured");
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
