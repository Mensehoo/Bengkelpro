import { useState } from "react";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Card, Btn, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const AuthPage = ({ type, onNav }) => {
  const isLogin = type === "login";
  const { signIn, signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");

    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    if (!isLogin && form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (!isLogin && !form.fullName) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(form.email, form.password);
        // Routing ditangani App.jsx via onAuthStateChange
      } else {
        await signUp({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
        });
        setSuccessMsg(
          "Pendaftaran berhasil! Silakan cek email untuk konfirmasi, lalu login."
        );
        setTimeout(() => onNav("login"), 2500);
      }
    } catch (err) {
      const msg = err?.message || "Terjadi kesalahan, coba lagi.";
      if (msg.includes("Invalid login credentials"))
        setError("Email atau password salah.");
      else if (msg.includes("User already registered"))
        setError("Email sudah terdaftar. Silakan login.");
      else if (msg.includes("Email not confirmed"))
        setError("Email belum dikonfirmasi. Cek inbox Anda.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif", padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: theme.primary, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="wrench" size={24} color="#fff" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 24, color: theme.text }}>BengkelPro</div>
          <div style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>
            {isLogin ? "Masuk ke akun Anda" : "Daftar sebagai pelanggan baru"}
          </div>
        </div>

        <Card style={{ padding: 32 }}>
          {/* Error */}
          {error && (
            <div style={{ background: theme.danger + "12", border: `1px solid ${theme.danger}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="alert" size={16} color={theme.danger} />
              <span style={{ fontSize: 13, color: theme.danger, fontWeight: 600 }}>{error}</span>
            </div>
          )}
          {/* Success */}
          {successMsg && (
            <div style={{ background: theme.success + "12", border: `1px solid ${theme.success}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="check" size={16} color={theme.success} />
              <span style={{ fontSize: 13, color: theme.success, fontWeight: 600 }}>{successMsg}</span>
            </div>
          )}

          {/* Form Fields */}
          {!isLogin && (
            <Input label="Nama Lengkap" placeholder="Masukkan nama lengkap" value={form.fullName} onChange={set("fullName")} />
          )}
          <Input label="Email" placeholder="email@example.com" type="email" value={form.email} onChange={set("email")} />
          {!isLogin && (
            <Input label="No. HP (opsional)" placeholder="08xx-xxxx-xxxx" type="tel" value={form.phone} onChange={set("phone")} />
          )}
          <Input label="Password" type="password" placeholder="Min. 6 karakter" value={form.password} onChange={set("password")} />
          {!isLogin && (
            <Input label="Konfirmasi Password" type="password" placeholder="Ulangi password" value={form.confirmPassword} onChange={set("confirmPassword")} />
          )}

          {isLogin && (
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: theme.primary, cursor: "pointer", fontWeight: 600 }}>Lupa password?</span>
            </div>
          )}

          {/* Submit */}
          <Btn
            onClick={handleSubmit}
            style={{ width: "100%", justifyContent: "center", marginBottom: 16, opacity: loading ? 0.7 : 1 }}
            size="lg"
            icon={loading ? undefined : isLogin ? "arrow_right" : "check"}
          >
            {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
          </Btn>

          <div style={{ textAlign: "center", fontSize: 13, color: theme.textMuted }}>
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <span
              onClick={() => { setError(""); setSuccessMsg(""); onNav(isLogin ? "register" : "login"); }}
              style={{ color: theme.primary, fontWeight: 700, cursor: "pointer" }}
            >
              {isLogin ? "Daftar" : "Masuk"}
            </span>
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span onClick={() => onNav("landing")} style={{ fontSize: 12, color: theme.textMuted, cursor: "pointer" }}>
            ← Kembali ke halaman utama
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
