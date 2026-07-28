import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { listActiveRooms, type Room as DbRoom } from "@/lib/rooms";
import {
  Users, Mic, GraduationCap, Trophy, TrendingUp, Sparkles, Search,
  ArrowRight, BookOpen, Heart, Shield, MessageSquare, Compass,
  Plus, UserCircle, Globe, CheckCircle2, Star, Lock, Radio,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillLoom Morocco — Learn, Teach & Connect" },
      { name: "description", content: "Morocco's professional learning and mentorship community. Join voice rooms, find mentors, and share your skills with verified members." },
    ],
  }),
  component: Root,
});

function Root() {
  const { user, profile, isAdmin } = useAuth();
  if (!user) return <Landing />;
  if (isAdmin || (profile?.profile_completed && profile?.status === "approved")) {
    return <Dashboard />;
  }
  return <Landing />;
}

/* ============================================================
   LANDING
   ============================================================ */

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute -top-32 left-1/2 -z-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="mr-1.5 h-3 w-3" /> Built for Moroccan learners & mentors
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Every Moroccan can{" "}
              <span className="text-gradient-primary">learn, teach</span>
              {" "}and inspire others.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Join Morocco's professional learning and mentorship community — a verified network where skills are shared, mentors are found, and futures are built together.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-primary px-6 text-base font-semibold shadow-glow hover:opacity-95">
                <Link to="/auth">Join SkillLoom <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base font-semibold">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Verified members</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Free to join</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Arabic, French & English</span>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="relative rounded-3xl border border-border bg-card p-2 shadow-elevated">
              <div className="rounded-2xl bg-gradient-soft p-6 sm:p-10">
                <HeroIllustration />
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-x-20 -bottom-10 h-40 bg-gradient-to-t from-background to-transparent" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} value="2,400+" label="Total members" />
          <StatCard icon={Mic} value="180+" label="Active rooms" />
          <StatCard icon={GraduationCap} value="350+" label="Verified mentors" />
          <StatCard icon={Sparkles} value="1,200+" label="Skills shared" />
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3 rounded-full">What you can do</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A focused space to grow your skills</h2>
            <p className="mt-3 text-muted-foreground">Four things SkillLoom does exceptionally well.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={BookOpen} title="Learn from experts" desc="Follow professionals across tech, design, business, languages and more." />
            <FeatureCard icon={GraduationCap} title="Teach what you know" desc="Share your craft, host sessions and grow a reputation as a mentor." />
            <FeatureCard icon={Mic} title="Join voice rooms" desc="Drop into live audio rooms organised by topic, language and level." />
            <FeatureCard icon={Heart} title="Build connections" desc="Meet driven Moroccans, exchange feedback and grow together." />
          </div>
        </div>
      </section>

      {/* Community values */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 rounded-full">Community values</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A safe, respectful place to learn</h2>
          <p className="mt-3 text-muted-foreground">Every member is verified. Every interaction is held to a higher standard.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard icon={Heart} title="Respect everyone" desc="Be kind. Be patient. Lift others up." color="text-rose-500" />
          <ValueCard icon={Sparkles} title="Share knowledge" desc="Teach generously. Learn humbly." color="text-amber-500" />
          <ValueCard icon={Shield} title="Support learners" desc="Encourage progress, however small." color="text-emerald-500" />
          <ValueCard icon={CheckCircle2} title="Professional behaviour" desc="Show up the way you'd want to be welcomed." color="text-primary" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center text-primary-foreground shadow-elevated sm:p-16">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your next skill starts here.</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">Create your verified profile in minutes — join thousands of learners and mentors building the future of Morocco.</p>
            <Button asChild size="lg" className="mt-6 h-12 rounded-xl bg-background px-6 text-base font-semibold text-primary hover:bg-background/95">
              <Link to="/auth">Get started — it's free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary text-xs font-black text-primary-foreground">SB</span>
            SkillLoom<span className="text-primary">Morocco</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SkillLoom Morocco. Built with care.</p>
        </div>
      </footer>
    </div>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-black">SB</span>
          </span>
          <span className="text-[15px]">SkillLoom<span className="text-primary"> Morocco</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-lg bg-gradient-primary hover:opacity-95">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <Card className="group relative overflow-hidden border-border p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-extrabold tracking-tight">{value}</div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Card className="group relative overflow-hidden p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </Card>
  );
}

function ValueCard({ icon: Icon, title, desc, color }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; color: string }) {
  return (
    <Card className="p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <Icon className={`h-7 w-7 ${color}`} />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}

function HeroIllustration() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="grid h-2 w-2 place-items-center rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wide text-success">Live · 24</span>
        </div>
        <div className="mt-3 font-semibold">React for Beginners</div>
        <div className="text-xs text-muted-foreground">Hosted by Yasmine · Casablanca</div>
        <div className="mt-3 flex -space-x-1.5">
          {["A","B","C","D"].map((c, i) => (
            <span key={i} className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-gradient-primary text-[10px] font-bold text-primary-foreground">{c}</span>
          ))}
          <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-bold">+19</span>
        </div>
      </Card>
      <Card className="p-4 shadow-card sm:translate-y-4">
        <Badge variant="outline" className="rounded-full text-[10px]">Mentorship</Badge>
        <div className="mt-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">M</div>
          <div>
            <div className="text-sm font-semibold">Mehdi Tazi</div>
            <div className="text-xs text-muted-foreground">Senior Designer · Rabat</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {["Figma","UX","Design Systems"].map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
          ))}
        </div>
      </Card>
      <Card className="p-4 shadow-card">
        <div className="text-xs font-semibold text-muted-foreground">Trending skill</div>
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <div className="font-semibold">Arabic Calligraphy</div>
        </div>
        <div className="mt-3 grid grid-cols-5 items-end gap-1">
          {[40, 65, 50, 80, 95].map((h, i) => (
            <div key={i} className="rounded-sm bg-gradient-primary opacity-80" style={{ height: `${h}%`, minHeight: 8 }} />
          ))}
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">+128% this month</div>
      </Card>
    </div>
  );
}

/* ============================================================
   DASHBOARD (logged-in approved users)
   ============================================================ */

/* ============================================================
   DASHBOARD (logged-in approved users)
   ============================================================ */

interface MemberLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  professional_title: string | null;
  city: string | null;
  skills: string[] | null;
  avatar_url: string | null;
}

function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const name = profile?.first_name ?? (isAdmin ? "Admin" : "there");
  const [rooms, setRooms] = useState<DbRoom[] | null>(null);
  const [members, setMembers] = useState<MemberLite[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const refresh = () => listActiveRooms().then(setRooms).catch(() => setRooms([]));
    refresh();
    supabase
      .from("profiles")
      .select("id,first_name,last_name,professional_title,city,skills,avatar_url")
      .eq("status", "approved")
      .eq("profile_completed", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setMembers((data ?? []) as MemberLite[]));

    const channel = supabase
      .channel("rooms-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-soft p-6 shadow-card sm:p-8">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
                <Sparkles className="mr-1.5 h-3 w-3" /> Welcome back
              </Badge>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome, {name} 👋
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Ready to learn or share something today? Browse live rooms or start your own.
              </p>
              <div className="mt-5 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-card focus-within:border-primary/50 focus-within:shadow-glow">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms, skills or members…"
                  className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              <QuickActionButton icon={Compass} label="Browse rooms" onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })} />
              <QuickActionButton icon={Plus} label="Create room" onClick={() => setCreateOpen(true)} />
              <QuickActionLink icon={UserCircle} label="View profile" to="/profile" />
            </div>
          </div>
        </section>

        {/* Live rooms */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Live rooms</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Active voice conversations happening right now</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="bg-gradient-primary">
              <Plus className="mr-1.5 h-4 w-4" /> New room
            </Button>
          </div>

          {rooms === null ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-56 animate-pulse bg-muted/40" />)}
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={Mic}
              title="No rooms available yet."
              desc="Be the first to create a learning room and start sharing your knowledge."
              cta={<Button onClick={() => setCreateOpen(true)} className="bg-gradient-primary"><Plus className="mr-1.5 h-4 w-4" /> Create the first room</Button>}
            />
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {rooms.map((r) => <RoomCard key={r.id} room={r} onJoin={() => navigate({ to: "/rooms/$roomId", params: { roomId: r.id } })} />)}
            </div>
          )}
        </section>

        {/* Members */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Verified members</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Moroccans building together</p>
            </div>
          </div>

          {members === null ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-44 animate-pulse bg-muted/40" />)}
            </div>
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="No members to display yet." desc="As soon as members complete and verify their profile, they'll appear here." />
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((m) => <MemberCard key={m.id} member={m} />)}
            </div>
          )}
        </section>
      </main>

      <CreateRoomModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
function QuickActionLink({ icon: Icon, label, to }: { icon: React.ComponentType<{ className?: string }>; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc, cta }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; cta?: React.ReactNode }) {
  return (
    <Card className="mt-5 flex flex-col items-center justify-center gap-3 px-6 py-14 text-center shadow-card">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
      {cta && <div className="mt-2">{cta}</div>}
    </Card>
  );
}

function RoomCard({ room, onJoin }: { room: DbRoom; onJoin: () => void }) {
  return (
    <Card className="group overflow-hidden border-border shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className={`relative h-28 bg-gradient-to-br ${room.cover_gradient ?? "from-blue-500 to-indigo-600"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)] opacity-30" />
        {room.topic && (
          <Badge className="absolute left-3 top-3 rounded-full bg-background/90 text-foreground hover:bg-background">
            {room.topic}
          </Badge>
        )}
        <div className="absolute right-3 top-3 flex gap-1">
          {room.language && (
            <Badge className="rounded-full bg-background/90 text-foreground hover:bg-background">
              <Globe className="mr-1 h-3 w-3" /> {room.language}
            </Badge>
          )}
          {room.is_private && (
            <Badge className="rounded-full bg-background/90 text-foreground hover:bg-background">
              <Lock className="h-3 w-3" />
            </Badge>
          )}
        </div>
        {room.status === "active" && (
          <Badge className="absolute bottom-3 left-3 rounded-full bg-success/90 text-white hover:bg-success">
            <Radio className="mr-1 h-3 w-3 animate-pulse" /> Live
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{room.title}</h3>
        {room.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{room.description}</p>}
        <Button size="sm" className="mt-4 w-full rounded-lg" onClick={onJoin}>
          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Join room
        </Button>
      </div>
    </Card>
  );
}

function MemberCard({ member }: { member: MemberLite }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => {
    if (!member.avatar_url) return;
    supabase.storage.from("avatars").createSignedUrl(member.avatar_url, 60 * 60)
      .then(({ data }) => setAvatar(data?.signedUrl ?? null));
  }, [member.avatar_url]);
  const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Member";
  return (
    <Card className="group p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className="flex items-start gap-3">
        {avatar ? (
          <img src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow">
            {(member.first_name?.[0] ?? "M").toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{name}</h3>
          <p className="truncate text-xs text-muted-foreground">{member.professional_title ?? "Member"}</p>
          {member.city && <p className="mt-0.5 text-[11px] text-muted-foreground">📍 {member.city}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {(member.skills ?? []).slice(0, 3).map((s) => (
          <Badge key={s} variant="secondary" className="rounded-full text-[10px]">{s}</Badge>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> Verified</span>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary">
          <Link to="/profile">View profile</Link>
        </Button>
      </div>
    </Card>
  );
}

// Suppress unused warning
void Trophy; void GraduationCap; void TrendingUp;
