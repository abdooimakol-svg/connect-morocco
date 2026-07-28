import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, LogOut, Mail } from "lucide-react";

export const Route = createFileRoute("/rejected")({
  component: RejectedPage,
});

function RejectedPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute -top-40 left-1/2 -z-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-destructive opacity-10 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-12">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-10 w-10" />
        </div>
        <Badge variant="outline" className="mt-4 rounded-full border-destructive/30 bg-destructive/10 text-destructive">
          Application not approved
        </Badge>
        <Card className="mt-6 w-full p-8 text-center shadow-elevated">
          <h1 className="text-2xl font-extrabold tracking-tight">We couldn't verify your application</h1>
          <p className="mt-2 text-muted-foreground">
            Your account verification was reviewed and not approved by the SkillLoom team.
          </p>
          {profile?.rejection_reason && (
            <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wide text-destructive">Reason</div>
              <p className="mt-1.5 text-sm text-foreground">{profile.rejection_reason}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Questions? Reach out to the admin team.
            </span>
          </div>
          <Button variant="outline" className="mt-6 rounded-xl"
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
