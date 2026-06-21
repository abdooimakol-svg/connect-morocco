import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth, ADMIN_EMAIL } from "@/lib/auth-context";

const PUBLIC_PATHS = ["/auth", "/reset-password", "/landing"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
    // Root "/" is auth-aware (landing if logged out, dashboard if approved).
    const isRoot = path === "/";

    if (!user) {
      if (!isPublic && !isRoot) navigate({ to: "/auth" });
      return;
    }

    if (path.startsWith("/admin")) {
      if (!isAdmin) navigate({ to: "/" });
      return;
    }

    if (isPublic && path !== "/reset-password") {
      navigate({ to: "/" });
      return;
    }

    if (isAdmin) return;
    if (!profile) return;

    if (!profile.profile_completed) {
      if (path !== "/complete-profile") navigate({ to: "/complete-profile" });
      return;
    }

    if (profile.status === "pending") {
      if (path !== "/pending-review") navigate({ to: "/pending-review" });
      return;
    }

    if (profile.status === "rejected") {
      if (path !== "/rejected") navigate({ to: "/rejected" });
      return;
    }

    if (["/pending-review", "/rejected", "/complete-profile"].includes(path)) {
      navigate({ to: "/" });
    }
  }, [loading, user, profile, isAdmin, path, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
          <p className="text-xs font-medium text-muted-foreground">Loading SkillBridge…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export { ADMIN_EMAIL };
