import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Mail, Phone, Briefcase, GraduationCap, Globe, Languages,
  Sparkles, Target, BookOpen, Edit3, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Your profile · SkillBridge Morocco" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.avatar_url) return;
    supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 60 * 60)
      .then(({ data }) => setAvatar(data?.signedUrl ?? null));
  }, [profile?.avatar_url]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
          No profile available yet.
        </main>
      </div>
    );
  }

  const fields: Array<keyof typeof profile> = [
    "first_name", "last_name", "username", "city", "phone_number",
    "professional_title", "bio", "skills", "experience", "languages",
    "education", "occupation", "learning_goals", "teaching_interests",
    "avatar_url", "cin_url",
  ];
  const filled = fields.filter((f) => {
    const v = profile[f];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  const completion = Math.round((filled / fields.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header card */}
        <Card className="relative overflow-hidden border-border shadow-card">
          <div className="h-32 bg-gradient-primary sm:h-40">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
          </div>
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {avatar ? (
                  <img src={avatar} alt="" className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-elevated sm:h-28 sm:w-28" />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-card bg-gradient-primary text-3xl font-black text-primary-foreground shadow-elevated sm:h-28 sm:w-28">
                    {(profile.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    {profile.status === "approved" && (
                      <Badge variant="outline" className="rounded-full border-success/40 bg-success/10 text-success">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.professional_title ?? "Add a professional title"}
                    {profile.city && <> · 📍 {profile.city}</>}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/complete-profile"><Edit3 className="mr-1.5 h-4 w-4" /> Edit profile</Link>
              </Button>
            </div>

            {/* Completion */}
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Profile completion</span>
                <span className="font-bold text-primary">{completion}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                A complete profile gets up to 3× more connections.
              </p>
            </div>
          </div>
        </Card>

        {/* Sections */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Section icon={BookOpen} title="About">
              {profile.bio ? (
                <p className="text-sm leading-relaxed text-foreground">{profile.bio}</p>
              ) : <Empty label="Add a short bio so others can know you." />}
            </Section>

            <Section icon={Sparkles} title="Skills">
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s, i) => (
                    <Badge key={i} className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">{s}</Badge>
                  ))}
                </div>
              ) : <Empty label="No skills added yet." />}
            </Section>

            <Section icon={Briefcase} title="Experience">
              {profile.experience ? <p className="text-sm text-foreground">{profile.experience}</p>
                : <Empty label="Share your professional experience." />}
              {profile.occupation && (
                <p className="mt-2 text-xs text-muted-foreground">Currently: {profile.occupation}</p>
              )}
            </Section>

            <Section icon={GraduationCap} title="Education">
              {profile.education ? <p className="text-sm text-foreground">{profile.education}</p>
                : <Empty label="Add your education." />}
            </Section>

            <div className="grid gap-6 sm:grid-cols-2">
              <Section icon={Target} title="Learning goals">
                {profile.learning_goals ? <p className="text-sm text-foreground">{profile.learning_goals}</p>
                  : <Empty label="What do you want to learn?" />}
              </Section>
              <Section icon={Sparkles} title="Teaching interests">
                {profile.teaching_interests ? <p className="text-sm text-foreground">{profile.teaching_interests}</p>
                  : <Empty label="What can you teach others?" />}
              </Section>
            </div>
          </div>

          <div className="space-y-6">
            <Section icon={Mail} title="Contact">
              <div className="space-y-2.5 text-sm">
                <Row icon={Mail} value={profile.email} />
                <Row icon={Phone} value={profile.phone_number} />
                <Row icon={MapPin} value={[profile.city, profile.country].filter(Boolean).join(", ")} />
                <Row icon={Globe} value={profile.linkedin} link />
                <Row icon={Globe} value={profile.portfolio} link />
              </div>
            </Section>

            <Section icon={Languages} title="Languages">
              {profile.languages && profile.languages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((l, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full">{l}</Badge>
                  ))}
                </div>
              ) : <Empty label="No languages listed." />}
            </Section>

            {profile.interests && profile.interests.length > 0 && (
              <Section icon={Sparkles} title="Interests">
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((s, i) => (
                    <Badge key={i} variant="outline" className="rounded-full">{s}</Badge>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 shadow-card transition-all hover:shadow-elevated">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm italic text-muted-foreground">{label}</p>;
}

function Row({ icon: Icon, value, link }: { icon: React.ComponentType<{ className?: string }>; value?: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {link ? (
        <a href={value} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{value}</a>
      ) : (
        <span className="break-words">{value}</span>
      )}
    </div>
  );
}
