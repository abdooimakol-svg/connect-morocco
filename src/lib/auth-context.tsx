import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_EMAIL = "makolabdo@gmail.com";

export type ProfileStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  city: string | null;
  country: string | null;
  phone_number: string | null;
  gmail: string | null;
  professional_title: string | null;
  bio: string | null;
  skills: string[] | null;
  experience: string | null;
  languages: string[] | null;
  education: string | null;
  occupation: string | null;
  linkedin: string | null;
  portfolio: string | null;
  interests: string[] | null;
  learning_goals: string | null;
  teaching_interests: string | null;
  cin_url: string | null;
  profile_completed: boolean;
  status: ProfileStatus;
  rejection_reason: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => { fetchProfile(newSession.user.id); }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isAdmin, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
