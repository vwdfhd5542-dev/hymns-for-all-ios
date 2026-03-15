import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[useAuth] onAuthStateChange:", event, session?.user?.id ?? "no user");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[useAuth] getSession:", session?.user?.id ?? "no session", error?.message ?? "no error");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user, loading, signOut };
}
