import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, FileSearch, Mail, LogOut, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/pending-review")({
  component: PendingReview,
});

function PendingReview() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute -top-40 left-1/2 -z-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-primary opacity-20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12">
        {/* Illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" style={{ animationDuration: "2.5s" }} />
          <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <Clock className="h-12 w-12" />
          </div>
        </div>

        <Badge variant="outline" className="rounded-full border-warning/40 bg-warning/10 px-3 py-1 text-warning">
          <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-warning" /> Pending review
        </Badge>

        <Card className="mt-6 w-full max-w-xl border-border p-8 text-center shadow-elevated">
          <div dir="rtl" className="space-y-3">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">شكراً على إرسال معلوماتك</h1>
            <p className="text-muted-foreground">سنقوم بمراجعة معلوماتك والتحقق منها.</p>
            <p className="text-muted-foreground">يرجى الانتظار حتى تتم مراجعة الطلب.</p>
          </div>

          <div className="mt-6 border-t border-border pt-6 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Review process</h2>
            <ol className="mt-4 space-y-4">
              <TimelineStep
                done
                icon={CheckCircle2}
                title="Profile submitted"
                desc="We've received your information and CIN document."
              />
              <TimelineStep
                active
                icon={FileSearch}
                title="Verification in progress"
                desc="Our team is reviewing your details. This usually takes 24–48 hours."
              />
              <TimelineStep
                icon={Mail}
                title="Decision notification"
                desc="You'll see the result here as soon as the review is complete."
              />
              <TimelineStep
                icon={ShieldCheck}
                title="Full access unlocked"
                desc="Join rooms, message members and start mentoring."
              />
            </ol>
          </div>

          {user?.email && (
            <p className="mt-6 text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
          )}

          <Button variant="outline" className="mt-4 rounded-xl"
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}

function TimelineStep({
  icon: Icon, title, desc, done, active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; done?: boolean; active?: boolean;
}) {
  const state = done ? "done" : active ? "active" : "idle";
  const ring = state === "done"
    ? "bg-success text-success-foreground"
    : state === "active"
      ? "bg-gradient-primary text-primary-foreground shadow-glow"
      : "bg-muted text-muted-foreground";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${ring}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {state === "active" && (
            <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-[10px] text-primary">In progress</Badge>
          )}
          {state === "done" && (
            <Badge variant="outline" className="rounded-full border-success/30 bg-success/10 text-[10px] text-success">Done</Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
