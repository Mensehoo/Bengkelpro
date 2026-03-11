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
        new Promise((_, reject) => setTimeout(() => reject(new Error("Koneksi Database Timeout (6s).")), 6000)),
      ]);

      if (!error && data) { 
        // Selalu gunakan role dari database (profiles) jika ada!
        setProfile(data); 
        return; 
      }
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
    } catch (err) {
      if (err.message === "Koneksi Database Timeout (6s).") throw err;
      // Jika error 500/Internal, lempar ke atas biar muncul di UI
      if (err.status === 500 || err.message?.includes("500")) {
        throw new Error("Database Error (500): Kemungkinan Infinite Recursion di RLS. Jalankan SQL Fix!");
      }
    }

    // Profile belum ada — buat manual (fallback trigger)
    try {
      const { data: created, error: upsertError } = await Promise.race([
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
        new Promise((_, reject) => setTimeout(() => reject(new Error("Koneksi Database Timeout (6s).")), 6000)),
      ]);
      
      if (upsertError) throw upsertError;
      if (created) setProfile(created);
    } catch (err) {
      console.error("[BengkelPro] fetchProfile critical error:", err);
      throw new Error(err.message || "Gagal membuat profile di database.");
    }
  };

  useEffect(() => {
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await fetchProfile(session.user.id, session.user.user_metadata);
        } catch (e) { console.error(e); }
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            await fetchProfile(session.user.id, session.user.user_metadata);
          } catch (e) { console.error(e); }
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
    if (supabase.supabaseUrl.includes("placeholder.supabase.co")) {
      throw new Error("Konfigurasi Supabase belum benar di Vercel. Silakan isi Environment Variables dan REDEPLOY.");
    }

    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Koneksi ke Supabase timeout. Coba lagi.")), 10000)),
    ]);
    
    if (error) throw error;

    // CRITICAL: Tunggu profile berhasil diambil/dibuat sebelum sukses login
    // Agar jika ada error 500 di database, user dapet alert di AuthPage
    if (data?.user) {
      await fetchProfile(data.user.id, data.user.user_metadata);
    }
    
    return data;
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
