import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/pending-review")({
  component: PendingReview,
});

function PendingReview() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4" dir="rtl">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">شكراً على إرسال معلوماتك.</h1>
        <p className="mt-3 text-muted-foreground">سنراجع معلوماتك ونتحقق منها.</p>
        <p className="mt-1 text-muted-foreground">يرجى الانتظار حتى تتم مراجعة طلبك.</p>
        <Button variant="outline" className="mt-6"
          onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
          تسجيل الخروج
        </Button>
      </Card>
    </div>
  );
}
