import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil profile — buat baru kalau belum ada, timeout 6 detik
  const fetchProfile = async (userId, userMeta = {}) => {
    try {
      const { data, error } = await Promise.race([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
      ]);

      if (!error && data) { setProfile(data); return; }
    } catch (_) { /* timeout atau error lain, lanjut coba upsert */ }

    // Profile belum ada — buat manual (fallback trigger)
    try {
      const { data: created } = await Promise.race([
        supabase
          .from("profiles")
          .upsert({
            id:        userId,
            full_name: userMeta?.full_name || "",
            role:      userMeta?.role      || "customer",
            phone:     userMeta?.phone     || null,
          })
          .select()
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
      ]);
      if (created) setProfile(created);
    } catch (_) {
      // Gagal total — biarkan profile null, user tetap bisa logout
      console.warn("[BengkelPro] fetchProfile gagal, profile null");
    }
  };

  useEffect(() => {
    // Safety timeout — loading TIDAK akan stuck lebih dari 8 detik
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.user_metadata);
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    });

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

    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer); };
  }, []);

  // Login
  const signIn = async (email, password) => {
    // Validasi apakah env vars sudah benar (bukan placeholder)
    if (supabase.supabaseUrl.includes("placeholder.supabase.co")) {
      throw new Error("Konfigurasi Supabase belum benar di Vercel. Silakan isi Environment Variables dan REDEPLOY.");
    }

    try {
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Koneksi ke Supabase timeout. Coba lagi.")), 10000)),
      ]);
      
      if (error) throw error;
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Register customer baru
  const signUp = async ({ email, password, fullName, phone }) => {
    if (supabase.supabaseUrl.includes("placeholder.supabase.co")) {
      throw new Error("Konfigurasi Supabase belum benar di Vercel. Silakan isi Environment Variables dan REDEPLOY.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "customer" } },
    });
    if (error) throw error;
    // Upsert profile manual sebagai backup trigger
    if (data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id, full_name: fullName, phone, role: "customer",
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
