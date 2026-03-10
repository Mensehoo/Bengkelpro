import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil profile (role) dari tabel profiles, buat baru jika belum ada
  const fetchProfile = async (userId, userMeta = {}) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
      return;
    }

    // Profile belum ada (trigger gagal) — buat manual
    const { data: created } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: userMeta?.full_name || "",
        role: userMeta?.role || "customer",
        phone: userMeta?.phone || null,
      })
      .select()
      .single();

    if (created) setProfile(created);
  };

  useEffect(() => {
    // Cek session aktif saat pertama load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id, session.user.user_metadata);
      setLoading(false);
    });

    // Listen perubahan auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.user_metadata);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login dengan email + password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Register pelanggan baru
  const signUp = async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "customer" },
      },
    });
    if (error) throw error;
    // Jika email confirmation dimatikan, langsung insert profile
    if (data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        phone,
        role: "customer",
      });
    }
    return data;
  };

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
