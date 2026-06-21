import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Mic, GraduationCap, Trophy, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge Morocco — Learn & Teach Skills" },
      { name: "description", content: "A community platform connecting Moroccan learners and mentors through rooms, mentorship and live sessions." },
    ],
  }),
  component: Home,
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Card className="p-6">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}

function Home() {
  const { profile, isAdmin } = useAuth();
  const name = profile?.first_name ?? "there";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Ahlan, {name}. Build skills with Morocco.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Join live rooms, find mentors, and share what you know with a verified community of learners across the kingdom.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg">Explore Rooms</Button>
            <Button size="lg" variant="outline">Find a Mentor</Button>
            {isAdmin && (
              <Button asChild size="lg" variant="secondary">
                <Link to="/admin">Open Admin</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="—" label="Active members" />
          <Stat value="—" label="Live rooms" />
          <Stat value="—" label="Mentors" />
          <Stat value="—" label="Skills shared" />
        </section>

        {/* Sections */}
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature icon={Users} title="Featured Rooms" desc="Curated study & practice spaces — coming soon." />
          <Feature icon={GraduationCap} title="Top Mentors" desc="Connect with experienced Moroccan professionals." />
          <Feature icon={TrendingUp} title="Trending Skills" desc="Discover what your peers are learning right now." />
          <Feature icon={Mic} title="Voice Rooms" desc="Drop into live audio rooms — launching next." />
          <Feature icon={Trophy} title="Success Stories" desc="Real stories from members who leveled up here." />
          <Feature icon={Sparkles} title="Gamification" desc="XP, badges and weekly leaderboards." />
        </section>
      </main>
    </div>
  );
}
