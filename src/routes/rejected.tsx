import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/rejected")({
  component: RejectedPage,
});

function RejectedPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-destructive/5 via-background to-background p-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Application not approved</h1>
        <p className="mt-2 text-muted-foreground">
          Your account verification was rejected by the SkillBridge team.
        </p>
        {profile?.rejection_reason && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left text-sm">
            <div className="font-medium text-destructive">Reason</div>
            <p className="mt-1 text-foreground">{profile.rejection_reason}</p>
          </div>
        )}
        <Button variant="outline" className="mt-6"
          onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
