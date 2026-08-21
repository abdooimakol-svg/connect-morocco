import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
  head: () => ({
    meta: [
      { title: "Signing you in — SkillLoom Morocco" },
      { name: "description", content: "Completing your secure sign-in to SkillLoom Morocco." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

/**
 * Supabase OAuth return point. Supabase JS reads the code/hash from the URL and
 * persists the session; we simply wait for it, then hand control back to the
 * existing AuthGate, which applies the onboarding / pending / rejected flow.
 */
function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const finish = (path: string) => {
      if (done) return;
      done = true;
      navigate({ to: path, replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish("/");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish("/");
    });

    const timeout = setTimeout(() => {
      if (!done) {
        toast.error("Sign-in did not complete. Please try again.");
        finish("/auth");
      }
    }, 10000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        <p className="text-xs font-medium text-muted-foreground">Completing sign-in…</p>
      </div>
    </div>
  );
}
