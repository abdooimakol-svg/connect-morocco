import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth, ADMIN_EMAIL } from "@/lib/auth-context";

const PUBLIC_PATHS = ["/auth", "/reset-password"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

    // Not logged in
    if (!user) {
      if (!isPublic) navigate({ to: "/auth" });
      return;
    }

    // Admin can always go to /admin
    if (path.startsWith("/admin")) {
      if (!isAdmin) navigate({ to: "/" });
      return;
    }

    // Logged in but on /auth → go home (gate decides next step)
    if (isPublic && path !== "/reset-password") {
      navigate({ to: "/" });
      return;
    }

    // Admin email bypasses profile/status checks for normal pages
    if (isAdmin) return;

    if (!profile) return; // still loading profile

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

    // approved → if on a gate page, push to home
    if (["/pending-review", "/rejected", "/complete-profile"].includes(path)) {
      navigate({ to: "/" });
    }
  }, [loading, user, profile, isAdmin, path, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export { ADMIN_EMAIL };
