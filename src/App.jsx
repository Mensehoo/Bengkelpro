import { useState, Component } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { theme } from "./constants/theme";
import Icon from "./components/Icon";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "sans-serif", padding: 24, background: "#fff8f8" }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#e53e3e" }}>Terjadi Error</div>
          <pre style={{ background: "#f7f7f7", padding: 16, borderRadius: 8, fontSize: 12, maxWidth: 600, overflow: "auto", color: "#333", border: "1px solid #ddd" }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <div style={{ fontSize: 13, color: "#666" }}>Pastikan environment variables Supabase sudah diisi dengan benar di Vercel.</div>
        </div>
      );
    }
    return this.props.children;
  }
}


import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import CustomerPanel from "./pages/CustomerPanel";
import KasirPanel from "./pages/KasirPanel";
import MekanikPanel from "./pages/MekanikPanel";
import AdminPanel from "./pages/AdminPanel";
import OwnerPanel from "./pages/OwnerPanel";

// ─── Panel Map (role → komponen) ─────────────────────────────────────────────
const ROLE_PANELS = {
  customer: CustomerPanel,
  kasir:    KasirPanel,
  mekanik:  MekanikPanel,
  admin:    AdminPanel,
  owner:    OwnerPanel,
};

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif", gap: 16 }}>
    <div style={{ width: 52, height: 52, background: theme.primary, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name="wrench" size={24} color="#fff" />
    </div>
    <div style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>BengkelPro</div>
    <div style={{ width: 36, height: 36, border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Inner App (butuh useAuth, harus di dalam AuthProvider) ──────────────────
const AppInner = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [screen, setScreen] = useState("landing"); // "landing" | "login" | "register"

  // Tampilkan spinner saat cek session awal
  if (loading) return <LoadingScreen />;

  // ── Sudah login ──────────────────────────────────────────────────────────
  if (user && profile) {
    const Panel = ROLE_PANELS[profile.role];
    if (Panel) return <Panel onLogout={signOut} userName={profile.full_name} />;
    // Role tidak dikenal — tampilkan pesan error
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: 700, color: theme.danger }}>Role tidak dikenali: "{profile.role}"</div>
        <button onClick={signOut} style={{ background: theme.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Keluar</button>
      </div>
    );
  }

  // ── Belum login ──────────────────────────────────────────────────────────
  if (screen === "login")    return <AuthPage type="login"    onNav={setScreen} />;
  if (screen === "register") return <AuthPage type="register" onNav={setScreen} />;
  return <LandingPage onNav={setScreen} />;
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Sora', sans-serif; }
        `}</style>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
