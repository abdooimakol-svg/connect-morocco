import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Mail, Lock, ArrowLeft, CheckCircle2, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you can sign in.");
    setTab("login");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link.");
  };




  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col bg-background">
        <header className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <span className="text-sm font-black">SL</span>
            </span>
            <span>SkillLoom<span className="text-primary"> Morocco</span></span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {tab === "login" && "Welcome back"}
              {tab === "register" && "Create your account"}
              {tab === "forgot" && "Reset password"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {tab === "login" && "Sign in to continue learning and teaching."}
              {tab === "register" && "Join Morocco's verified learning community."}
              {tab === "forgot" && "We'll send you a secure reset link."}
            </p>

            <div className="mt-8">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted p-1">
                  <TabsTrigger value="login" className="rounded-lg">Sign in</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg">Register</TabsTrigger>
                  <TabsTrigger value="forgot" className="rounded-lg">Forgot</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6 space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <FormField label="Email" icon={Mail}>
                      <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" />
                    </FormField>
                    <FormField label="Password" icon={Lock}>
                      <Input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-9" />
                    </FormField>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-95" disabled={loading}>
                      {loading ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-6 space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <FormField label="Email" icon={Mail}>
                      <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" />
                    </FormField>
                    <FormField label="Password" icon={Lock}>
                      <Input type="password" required minLength={6} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-9" />
                    </FormField>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-95" disabled={loading}>
                      {loading ? "Creating…" : "Create account"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="forgot" className="mt-6 space-y-4">
                  <form onSubmit={handleForgot} className="space-y-4">
                    <FormField label="Email" icon={Mail}>
                      <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" />
                    </FormField>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-95" disabled={loading}>
                      {loading ? "Sending…" : "Send reset link"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>


              <p className="mt-6 text-center text-xs text-muted-foreground">
                By continuing you agree to our community values: respect, professionalism and verified identity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3" /> Morocco's verified community
          </div>
          <div>
            <h2 className="text-balance text-4xl font-extrabold leading-tight">
              Where Moroccan talent learns, teaches and grows together.
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/85">
              Verified profiles. Real conversations. A serious place to build your skills with people who care about your growth.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              <BrandPoint icon={ShieldCheck}>Every member is identity-verified</BrandPoint>
              <BrandPoint icon={Users}>2,400+ professionals across the kingdom</BrandPoint>
              <BrandPoint icon={CheckCircle2}>Always free for learners and mentors</BrandPoint>
            </ul>
          </div>
          <div className="text-xs text-primary-foreground/70">
            © {new Date().getFullYear()} SkillLoom Morocco
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}

function BrandPoint({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 backdrop-blur">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {children}
    </li>
  );
}
