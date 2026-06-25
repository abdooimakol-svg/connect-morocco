import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "makolabdo@gmail.com";

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const callerEmail = (context.claims?.email as string | undefined)?.toLowerCase();
    if (callerEmail !== ADMIN_EMAIL) {
      throw new Error("Forbidden: admin only");
    }
    if (data.userId === context.userId) {
      throw new Error("Cannot delete your own admin account");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const targetId = data.userId;

    // Look up storage paths from profile before deleting
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url, cin_url")
      .eq("id", targetId)
      .maybeSingle();

    // Remove storage objects (best-effort)
    if (profile?.avatar_url) {
      await supabaseAdmin.storage.from("avatars").remove([profile.avatar_url]);
    }
    if (profile?.cin_url) {
      await supabaseAdmin.storage.from("cins").remove([profile.cin_url]);
    }

    // Delete related rows (no FK cascades exist)
    await supabaseAdmin.from("room_reactions").delete().eq("user_id", targetId);
    await supabaseAdmin.from("room_messages").delete().eq("user_id", targetId);
    await supabaseAdmin.from("room_participants").delete().eq("user_id", targetId);
    // Rooms hosted by this user
    await supabaseAdmin.from("rooms").delete().eq("host_id", targetId);
    // Profile
    await supabaseAdmin.from("profiles").delete().eq("id", targetId);

    // Audit log
    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: context.userId,
      target_user_id: targetId,
      action: "delete_user",
      details: { email_admin: callerEmail },
    });

    // Auth user (best-effort)
    let authDeleted = true;
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);
      if (error) authDeleted = false;
    } catch {
      authDeleted = false;
    }

    return { ok: true, authDeleted };
  });
