import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, GraduationCap, MapPin, Languages as LangIcon, Sparkles, Target, BookOpen, Heart, User as UserIcon } from "lucide-react";

export interface PublicProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  professional_title: string | null;
  bio: string | null;
  skills: string[] | null;
  experience: string | null;
  languages: string[] | null;
  education: string | null;
  occupation: string | null;
  interests: string[] | null;
  learning_goals: string | null;
  teaching_interests: string | null;
  city: string | null;
  country: string | null;
}

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileViewDialog({ userId, open, onOpenChange }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setProfile(null);
    setAvatarUrl(null);
    (async () => {
      const { data, error } = await supabase.rpc("get_public_profile", { _user_id: userId });
      if (cancelled) return;
      const p = (data?.[0] ?? null) as PublicProfile | null;
      if (error) console.error(error);
      setProfile(p);
      if (p?.avatar_url) {
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(p.avatar_url, 60 * 60);
        if (!cancelled) setAvatarUrl(signed?.signedUrl ?? null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || "Member" : "";
  const location = profile ? [profile.city, profile.country].filter(Boolean).join(", ") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Member profile</DialogTitle>
        </DialogHeader>

        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-primary/80 via-primary to-purple-600" />

        <div className="px-6 pb-6 -mt-12">
          {loading ? (
            <ProfileSkeleton />
          ) : !profile ? (
            <div className="py-10 text-center text-muted-foreground">Profile not available.</div>
          ) : (
            <>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="h-24 w-24 rounded-full object-cover ring-4 ring-background shadow-lg" />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-primary text-3xl font-bold text-primary-foreground ring-4 ring-background shadow-lg">
                    {(profile.first_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div className="flex-1 sm:pb-2">
                  <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
                  {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                  {profile.professional_title && (
                    <p className="mt-1 text-sm font-medium text-foreground/80">{profile.professional_title}</p>
                  )}
                  {location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {location}
                    </p>
                  )}
                </div>
              </div>

              {profile.bio && (
                <Section icon={UserIcon} title="About">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{profile.bio}</p>
                </Section>
              )}

              {profile.occupation && (
                <Section icon={Briefcase} title="Occupation">
                  <p className="text-sm text-foreground/85">{profile.occupation}</p>
                </Section>
              )}

              {profile.experience && (
                <Section icon={Sparkles} title="Experience">
                  <p className="whitespace-pre-wrap text-sm text-foreground/85">{profile.experience}</p>
                </Section>
              )}

              {profile.education && (
                <Section icon={GraduationCap} title="Education">
                  <p className="whitespace-pre-wrap text-sm text-foreground/85">{profile.education}</p>
                </Section>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <Section icon={Sparkles} title="Skills">
                  <ChipList items={profile.skills} />
                </Section>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <Section icon={LangIcon} title="Languages">
                  <ChipList items={profile.languages} variant="outline" />
                </Section>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <Section icon={Heart} title="Interests">
                  <ChipList items={profile.interests} variant="secondary" />
                </Section>
              )}

              {profile.teaching_interests && (
                <Section icon={BookOpen} title="Teaching interests">
                  <p className="whitespace-pre-wrap text-sm text-foreground/85">{profile.teaching_interests}</p>
                </Section>
              )}

              {profile.learning_goals && (
                <Section icon={Target} title="Learning goals">
                  <p className="whitespace-pre-wrap text-sm text-foreground/85">{profile.learning_goals}</p>
                </Section>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ChipList({ items, variant = "default" }: { items: string[]; variant?: "default" | "secondary" | "outline" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <Badge key={`${s}-${i}`} variant={variant} className="rounded-full">{s}</Badge>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div>
      <div className="flex items-end gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2 pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-12 rounded-full" /></div>
      </div>
    </div>
  );
}
