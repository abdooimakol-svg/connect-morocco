import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileCheck, ArrowLeft, ArrowRight, CheckCircle2,
  User as UserIcon, Briefcase, Sparkles, ShieldCheck, X,
} from "lucide-react";

export const Route = createFileRoute("/complete-profile")({
  component: CompleteProfile,
});

const STEPS = [
  { id: 1, title: "Personal", desc: "Who you are", icon: UserIcon },
  { id: 2, title: "Professional", desc: "What you do", icon: Briefcase },
  { id: 3, title: "Skills & interests", desc: "What drives you", icon: Sparkles },
  { id: 4, title: "Verification", desc: "Identity check", icon: ShieldCheck },
];

function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cinFile, setCinFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", username: "", gender: "",
    date_of_birth: "", city: "", country: "Morocco", phone_number: "",
    gmail: "", professional_title: "", bio: "",
    skills: "", experience: "", languages: "",
    education: "", occupation: "", linkedin: "", portfolio: "",
    interests: "", learning_goals: "", teaching_interests: "",
  });

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const uploadTo = async (bucket: string, file: File) => {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!avatarFile) return toast.error("Profile picture is required");
    if (!cinFile) return toast.error("CIN image is required");

    setLoading(true);
    try {
      const [avatarPath, cinPath] = await Promise.all([
        uploadTo("avatars", avatarFile),
        uploadTo("cins", cinFile),
      ]);

      const { error } = await supabase.from("profiles").update({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        avatar_url: avatarPath,
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        city: form.city,
        country: form.country,
        phone_number: form.phone_number,
        gmail: form.gmail,
        professional_title: form.professional_title,
        bio: form.bio,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: form.experience,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        education: form.education,
        occupation: form.occupation,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
        learning_goals: form.learning_goals,
        teaching_interests: form.teaching_interests,
        cin_url: cinPath,
        profile_completed: true,
      }).eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile submitted for review.");
      navigate({ to: "/pending-review" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const next = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-soft py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
            Step {step} of {STEPS.length}
          </Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Complete your profile</h1>
          <p className="mt-2 text-muted-foreground">A verified profile unlocks every part of SkillBridge.</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id} className="flex flex-col items-center text-center">
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition-all ${
                    done ? "bg-success text-success-foreground" :
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow scale-110" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </span>
                  <span className={`mt-1.5 text-[11px] font-semibold sm:text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{s.desc}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 shadow-elevated sm:p-8">
            {step === 1 && (
              <StepShell title="Personal information" desc="Tell us who you are. This is shown on your public profile.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="First name" required>
                    <Input required value={form.first_name} onChange={upd("first_name")} className="h-11" />
                  </Field>
                  <Field label="Last name" required>
                    <Input required value={form.last_name} onChange={upd("last_name")} className="h-11" />
                  </Field>
                  <Field label="Username" required>
                    <Input required value={form.username} onChange={upd("username")} className="h-11" placeholder="yasmine.dev" />
                  </Field>
                  <Field label="Gender">
                    <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs">
                      <option value="">Select…</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Date of birth">
                    <Input type="date" value={form.date_of_birth} onChange={upd("date_of_birth")} className="h-11" />
                  </Field>
                  <Field label="Phone number">
                    <Input type="tel" value={form.phone_number} onChange={upd("phone_number")} className="h-11" placeholder="+212 ..." />
                  </Field>
                  <Field label="Gmail">
                    <Input type="email" value={form.gmail} onChange={upd("gmail")} className="h-11" />
                  </Field>
                  <Field label="City" required>
                    <Input required value={form.city} onChange={upd("city")} className="h-11" placeholder="Casablanca" />
                  </Field>
                  <Field label="Country">
                    <Input value={form.country} onChange={upd("country")} className="h-11" />
                  </Field>
                  <Field label="Profile picture" required>
                    <FileDrop
                      file={avatarFile}
                      onChange={setAvatarFile}
                      hint="PNG or JPG, square works best"
                      accent={false}
                    />
                  </Field>
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Professional information" desc="Help others understand your background.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Professional title" required>
                    <Input required value={form.professional_title} onChange={upd("professional_title")} className="h-11" placeholder="Frontend Developer" />
                  </Field>
                  <Field label="Occupation" required>
                    <Input required value={form.occupation} onChange={upd("occupation")} className="h-11" />
                  </Field>
                  <Field label="Education" required>
                    <Input required value={form.education} onChange={upd("education")} className="h-11" placeholder="ENSIAS, BSc Computer Science" />
                  </Field>
                  <Field label="Experience" required>
                    <Input required value={form.experience} onChange={upd("experience")} className="h-11" placeholder="3 years at XYZ Studio" />
                  </Field>
                  <Field label="LinkedIn">
                    <Input type="url" value={form.linkedin} onChange={upd("linkedin")} className="h-11" placeholder="https://linkedin.com/in/…" />
                  </Field>
                  <Field label="Portfolio">
                    <Input type="url" value={form.portfolio} onChange={upd("portfolio")} className="h-11" placeholder="https://…" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Short bio" required>
                      <Textarea required rows={4} value={form.bio} onChange={upd("bio")} placeholder="A couple of sentences about what you do and what you love." />
                      <p className="mt-1 text-[11px] text-muted-foreground">{form.bio.length} / 280 characters recommended</p>
                    </Field>
                  </div>
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="Skills & interests" desc="Type a value and press Enter or comma to add a tag.">
                <div className="space-y-5">
                  <Field label="Skills" required>
                    <TagInput
                      value={form.skills}
                      onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
                      placeholder="React, Marketing, Arabic calligraphy…"
                    />
                  </Field>
                  <Field label="Languages" required>
                    <TagInput
                      value={form.languages}
                      onChange={(v) => setForm((f) => ({ ...f, languages: v }))}
                      placeholder="Arabic, French, English…"
                    />
                  </Field>
                  <Field label="Interests" required>
                    <TagInput
                      value={form.interests}
                      onChange={(v) => setForm((f) => ({ ...f, interests: v }))}
                      placeholder="Design, Startups, Calligraphy…"
                    />
                  </Field>
                  <Field label="Learning goals" required>
                    <Textarea required rows={3} value={form.learning_goals} onChange={upd("learning_goals")} placeholder="What do you want to learn this year?" />
                  </Field>
                  <Field label="Teaching interests" required>
                    <Textarea required rows={3} value={form.teaching_interests} onChange={upd("teaching_interests")} placeholder="What can you teach or mentor others on?" />
                  </Field>
                </div>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="Identity verification" desc="Upload a clear photo of your CIN. Used for verification only — never shown publicly.">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="text-sm">
                      <div className="font-semibold text-foreground">Why we verify identity</div>
                      <p className="mt-1 text-muted-foreground">SkillBridge keeps the community safe by ensuring every member is a real person. Your CIN is stored privately and used only for one-time verification.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <Field label="National ID Card (CIN)" required>
                    <FileDrop
                      file={cinFile}
                      onChange={setCinFile}
                      hint="Clear photo, all corners visible"
                      accent
                    />
                  </Field>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <div className="font-semibold">Ready to submit?</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Once submitted, our team will review your profile within 24–48 hours. You'll see the result on the pending review page.
                  </p>
                </div>
              </StepShell>
            )}
          </Card>

          {/* Footer nav */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={prev} disabled={step === 1}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length ? (
              <Button type="button" className="rounded-xl bg-gradient-primary px-6 shadow-glow hover:opacity-95" onClick={next}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="rounded-xl bg-gradient-primary px-6 shadow-glow hover:opacity-95" disabled={loading}>
                {loading ? "Submitting…" : "Submit for review"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function StepShell({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FileDrop({ file, onChange, hint, accent }: {
  file: File | null;
  onChange: (f: File | null) => void;
  hint: string;
  accent: boolean;
}) {
  return (
    <label className={`group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all ${
      accent
        ? "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10"
        : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted"
    }`}>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${accent ? "bg-primary text-primary-foreground" : "bg-card text-primary"}`}>
        {file ? <FileCheck className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {file ? file.name : "Click to upload"}
        </div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const tags = value.split(",").map((s) => s.trim()).filter(Boolean);

  const addTag = (t: string) => {
    const cleaned = t.trim();
    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    onChange([...tags, cleaned].join(", "));
    setDraft("");
  };

  const removeTag = (t: string) => {
    onChange(tags.filter((x) => x !== t).join(", "));
  };

  return (
    <div className="rounded-xl border border-input bg-background p-2 focus-within:border-primary/60 focus-within:shadow-glow">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="rounded-full hover:bg-primary/20">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) {
              addTag(v.slice(0, -1));
            } else {
              setDraft(v);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          onBlur={() => draft && addTag(draft)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
