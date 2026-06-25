import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { deleteUserAccount } from "@/lib/admin.functions";
import {
  Check, X, Eye, Users, Clock, ShieldCheck, ShieldX, Search, Trash2,
  MapPin, Mail, Phone, Briefcase, GraduationCap, Globe, FileImage,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function useSignedUrl(bucket: string, path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    supabase.storage.from(bucket).createSignedUrl(path, 60 * 60).then(({ data }) => {
      setUrl(data?.signedUrl ?? null);
    });
  }, [bucket, path]);
  return url;
}

function StatusBadge({ s }: { s: Profile["status"] }) {
  const map = {
    pending: "border-warning/40 bg-warning/10 text-warning",
    approved: "border-success/40 bg-success/10 text-success",
    rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return <Badge variant="outline" className={`rounded-full text-[10px] font-semibold uppercase tracking-wide ${map[s]}`}>{s}</Badge>;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string;
}) {
  return (
    <Card className="p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">{value}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function UserCard({ p, onChange }: { p: Profile; onChange: () => void }) {
  const avatar = useSignedUrl("avatars", p.avatar_url);
  const cin = useSignedUrl("cins", p.cin_url);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(p.rejection_reason ?? "");
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ status: "approved", rejection_reason: null }).eq("id", p.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Approved");
    onChange();
  };

  const reject = async () => {
    if (!reason.trim()) return toast.error("Please provide a reason");
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ status: "rejected", rejection_reason: reason }).eq("id", p.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setOpen(false);
    onChange();
  };

  return (
    <Card className="overflow-hidden shadow-card transition-all hover:shadow-elevated">
      <div className="flex items-start gap-4 p-5">
        {avatar ? (
          <img src={avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-primary text-base font-bold text-primary-foreground">
            {(p.first_name ?? p.email ?? "?")[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{p.first_name} {p.last_name}</h3>
            <StatusBadge s={p.status} />
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {p.professional_title ?? "—"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email ?? "—"}</span>
            {p.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</span>}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-5 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Skills</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(p.skills ?? []).slice(0, 5).map((s, i) => (
            <Badge key={i} variant="secondary" className="rounded-full text-[10px]">{s}</Badge>
          ))}
          {(!p.skills || p.skills.length === 0) && <span className="text-[11px] text-muted-foreground">No skills listed</span>}
        </div>
      </div>

      {cin && (
        <a href={cin} target="_blank" rel="noreferrer" className="block border-t border-border">
          <div className="flex items-center gap-2 px-5 py-2 text-[11px] font-medium text-muted-foreground">
            <FileImage className="h-3.5 w-3.5" /> CIN preview
          </div>
          <img src={cin} alt="CIN" className="max-h-32 w-full object-cover" />
        </a>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
        <Button size="sm" onClick={approve} disabled={busy || p.status === "approved"}
          className="rounded-lg bg-success text-success-foreground hover:bg-success/90">
          <Check className="mr-1 h-4 w-4" /> Approve
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive" className="rounded-lg" disabled={busy}>
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Rejection reason</DialogTitle></DialogHeader>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
              placeholder="Explain why this application is being rejected…" />
            <Button onClick={reject} variant="destructive" className="rounded-lg" disabled={busy}>
              Confirm reject
            </Button>
          </DialogContent>
        </Dialog>
        <DetailDialog p={p} avatar={avatar} cin={cin} />
      </div>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="break-words">{value}</div>
      </div>
    </div>
  );
}

function DetailDialog({ p, avatar, cin }: { p: Profile; avatar: string | null; cin: string | null }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg ml-auto">
          <Eye className="mr-1 h-4 w-4" /> View details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {(p.first_name ?? "?")[0]}
              </span>
            )}
            <div>
              <div>{p.first_name} {p.last_name}</div>
              <div className="text-xs font-normal text-muted-foreground">@{p.username ?? "—"}</div>
            </div>
            <StatusBadge s={p.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-5">
          <section>
            <SectionTitle>Contact</SectionTitle>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <DetailRow icon={Mail} label="Email" value={p.email} />
              <DetailRow icon={Phone} label="Phone" value={p.phone_number} />
              <DetailRow icon={MapPin} label="Location" value={[p.city, p.country].filter(Boolean).join(", ")} />
            </div>
          </section>
          <section>
            <SectionTitle>Professional</SectionTitle>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <DetailRow icon={Briefcase} label="Title" value={p.professional_title} />
              <DetailRow icon={Briefcase} label="Occupation" value={p.occupation} />
              <DetailRow icon={GraduationCap} label="Education" value={p.education} />
              <DetailRow icon={Briefcase} label="Experience" value={p.experience} />
              <DetailRow icon={Globe} label="LinkedIn" value={p.linkedin} />
              <DetailRow icon={Globe} label="Portfolio" value={p.portfolio} />
            </div>
          </section>
          {p.bio && (
            <section>
              <SectionTitle>Bio</SectionTitle>
              <p className="mt-2 text-sm text-muted-foreground">{p.bio}</p>
            </section>
          )}
          <section>
            <SectionTitle>Skills & languages</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-1">
              {(p.skills ?? []).map((s, i) => <Badge key={`s${i}`} variant="secondary" className="rounded-full">{s}</Badge>)}
              {(p.languages ?? []).map((s, i) => <Badge key={`l${i}`} variant="outline" className="rounded-full">{s}</Badge>)}
            </div>
          </section>
          {p.learning_goals && (
            <section>
              <SectionTitle>Learning goals</SectionTitle>
              <p className="mt-2 text-sm text-muted-foreground">{p.learning_goals}</p>
            </section>
          )}
          {p.teaching_interests && (
            <section>
              <SectionTitle>Teaching interests</SectionTitle>
              <p className="mt-2 text-sm text-muted-foreground">{p.teaching_interests}</p>
            </section>
          )}
          {cin && (
            <section>
              <SectionTitle>CIN document</SectionTitle>
              <a href={cin} target="_blank" rel="noreferrer">
                <img src={cin} alt="CIN" className="mt-2 max-h-72 w-full rounded-xl border border-border object-contain" />
              </a>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h4>;
}

function AdminPage() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Profile["status"]>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles")
      .select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setProfiles((data ?? []) as Profile[]);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const counts = {
    all: profiles.length,
    pending: profiles.filter((p) => p.status === "pending").length,
    approved: profiles.filter((p) => p.status === "approved").length,
    rejected: profiles.filter((p) => p.status === "rejected").length,
  };

  const q = query.trim().toLowerCase();
  const shown = profiles
    .filter((p) => filter === "all" ? true : p.status === filter)
    .filter((p) => {
      if (!q) return true;
      return [p.first_name, p.last_name, p.email, p.username, p.city, p.professional_title]
        .some((v) => (v ?? "").toLowerCase().includes(q));
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge variant="outline" className="rounded-full">Admin</Badge>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Member verification</h1>
            <p className="text-sm text-muted-foreground">Review applications and verify Moroccan community members.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="h-10 pl-9 rounded-xl" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total users" value={counts.all} color="bg-primary/10 text-primary" />
          <StatCard icon={Clock} label="Pending" value={counts.pending} color="bg-warning/15 text-warning" />
          <StatCard icon={ShieldCheck} label="Approved" value={counts.approved} color="bg-success/15 text-success" />
          <StatCard icon={ShieldX} label="Rejected" value={counts.rejected} color="bg-destructive/15 text-destructive" />
        </div>

        {/* Filters */}
        <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1 shadow-card">
          {(["all", "pending", "approved", "rejected"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
                filter === k ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {k}
              <span className={`rounded-full px-1.5 text-[10px] ${filter === k ? "bg-white/25" : "bg-muted"}`}>{counts[k]}</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/40" />
          ))}
          {!loading && shown.length === 0 && (
            <Card className="col-span-full p-10 text-center shadow-card">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-semibold">No members found</p>
              <p className="text-sm text-muted-foreground">Try a different filter or search.</p>
            </Card>
          )}
          {shown.map((p) => <UserCard key={p.id} p={p} onChange={load} />)}
        </div>
      </main>
    </div>
  );
}
