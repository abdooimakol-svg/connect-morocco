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
import { Upload, FileCheck } from "lucide-react";

export const Route = createFileRoute("/complete-profile")({
  component: CompleteProfile,
});

function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
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

  const Field = ({ label, k, type = "text", required = true }: { label: string; k: keyof typeof form; type?: string; required?: boolean }) => (
    <div className="space-y-1.5">
      <Label>{label}{required && " *"}</Label>
      <Input type={type} required={required} value={form[k]} onChange={upd(k)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold">Complete your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Tell the community about you. After review, you'll unlock full access.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Identity</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="First name" k="first_name" />
              <Field label="Last name" k="last_name" />
              <Field label="Username" k="username" />
              <Field label="Gender" k="gender" />
              <Field label="Date of birth" k="date_of_birth" type="date" />
              <Field label="Phone number" k="phone_number" type="tel" />
              <Field label="Gmail" k="gmail" type="email" />
              <Field label="City" k="city" />
              <Field label="Country" k="country" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Profile picture *</Label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background p-3 text-sm hover:bg-accent/5">
                  <Upload className="h-4 w-4" />
                  {avatarFile ? <span className="truncate">{avatarFile.name}</span> : <span>Choose image…</span>}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="space-y-1.5">
                <Label>National ID Card (CIN) *</Label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm hover:bg-primary/10">
                  <FileCheck className="h-4 w-4 text-primary" />
                  {cinFile ? <span className="truncate">{cinFile.name}</span> : <span>Upload CIN image…</span>}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => setCinFile(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-xs text-muted-foreground">Required. Used only for verification.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Professional</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Professional title" k="professional_title" />
              <Field label="Occupation" k="occupation" />
              <Field label="Education" k="education" />
              <Field label="Experience" k="experience" />
              <Field label="LinkedIn" k="linkedin" type="url" required={false} />
              <Field label="Portfolio" k="portfolio" type="url" required={false} />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>Bio *</Label>
              <Textarea required value={form.bio} onChange={upd("bio")} rows={3} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Skills & Interests</h2>
            <p className="text-xs text-muted-foreground">Comma-separated lists.</p>
            <div className="mt-4 grid gap-4">
              <Field label="Skills (e.g. React, Marketing, Arabic calligraphy)" k="skills" />
              <Field label="Languages" k="languages" />
              <Field label="Interests" k="interests" />
              <div className="space-y-1.5">
                <Label>Learning goals *</Label>
                <Textarea required value={form.learning_goals} onChange={upd("learning_goals")} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Teaching interests *</Label>
                <Textarea required value={form.teaching_interests} onChange={upd("teaching_interests")} rows={2} />
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Submitting…" : "Submit for review"}
          </Button>
        </form>
      </div>
    </div>
  );
}
