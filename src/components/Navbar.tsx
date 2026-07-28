import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, User as UserIcon, Home, Search } from "lucide-react";

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const initial = (profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  const navLink = (to: string, label: string, Icon: React.ComponentType<{ className?: string }>) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-black tracking-tight">SL</span>
          </span>
          <span className="hidden text-[15px] sm:inline">
            SkillLoom<span className="text-primary"> Morocco</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLink("/", "Home", Home)}
          {navLink("/profile", "Profile", UserIcon)}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search rooms, members…</span>
            <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-px text-[10px] font-medium">⌘K</kbd>
          </button>
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin">
                <Shield className="mr-1.5 h-4 w-4" /> Admin
              </Link>
            </Button>
          )}
          <Link
            to="/profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-card transition-transform hover:scale-105"
          >
            {initial}
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
