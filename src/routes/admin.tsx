import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye } from "lucide-react";

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
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
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
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        {avatar ? (
          <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
            {(p.first_name ?? p.email ?? "?")[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">
              {p.first_name} {p.last_name}
            </h3>
            <StatusBadge s={p.status} />
          </div>
          <div className="text-sm text-muted-foreground">
            @{p.username ?? "—"} · {p.email}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {p.city ?? "—"} · {p.phone_number ?? "—"} · {p.occupation ?? "—"}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-border p-4 text-sm md:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Skills</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(p.skills ?? []).slice(0, 6).map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
            ))}
            {(!p.skills || p.skills.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Education</div>
          <p className="mt-1 line-clamp-2 text-muted-foreground">{p.education ?? "—"}</p>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs font-medium text-muted-foreground">Bio</div>
          <p className="mt-1 line-clamp-3 text-muted-foreground">{p.bio ?? "—"}</p>
        </div>
        {cin && (
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">CIN</div>
            <a href={cin} target="_blank" rel="noreferrer">
              <img src={cin} alt="CIN" className="mt-1 max-h-48 rounded-md border border-border object-contain" />
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-3">
        <Button size="sm" onClick={approve} disabled={busy || p.status === "approved"}>
          <Check className="mr-1 h-4 w-4" /> Approve
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={busy}>
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Rejection reason</DialogTitle></DialogHeader>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
              placeholder="Explain why this application is being rejected…" />
            <Button onClick={reject} variant="destructive" disabled={busy}>Confirm reject</Button>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Eye className="mr-1 h-4 w-4" /> View details</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{p.first_name} {p.last_name}</DialogTitle></DialogHeader>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(p, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

function AdminPage() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Profile["status"]>("all");

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
      <div className="grid min-h-screen place-items-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const shown = profiles.filter((p) => filter === "all" ? true : p.status === filter);
  const counts = {
    all: profiles.length,
    pending: profiles.filter((p) => p.status === "pending").length,
    approved: profiles.filter((p) => p.status === "approved").length,
    rejected: profiles.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin dashboard</h1>
            <p className="text-muted-foreground">Review and verify community members.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((k) => (
            <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
              {k} <span className="ml-1.5 opacity-70">{counts[k]}</span>
            </Button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading && <p className="text-muted-foreground">Loading…</p>}
          {!loading && shown.length === 0 && <p className="text-muted-foreground">No users.</p>}
          {shown.map((p) => <UserCard key={p.id} p={p} onChange={load} />)}
        </div>
      </main>
    </div>
  );
}
