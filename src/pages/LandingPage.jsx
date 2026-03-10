import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Btn, Card } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const LandingPage = ({ onNav }) => {
  const isMobile = useIsMobile();

  const services = [
    { icon: "wrench",   title: "Servis Ringan", desc: "Tune-up & pengecekan rutin",   price: "Rp 75.000" },
    { icon: "package",  title: "Ganti Oli",     desc: "Oli mesin & filter",          price: "Rp 45.000" },
    { icon: "settings", title: "Turun Mesin",   desc: "Overhaul mesin lengkap",      price: "Rp 850.000" },
    { icon: "car",      title: "Servis Rem",    desc: "Kampas & minyak rem",         price: "Rp 120.000" },
  ];

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 20px" : "18px 60px", borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0, background: "#fff", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: theme.primary, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="wrench" size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: isMobile ? 16 : 18, color: theme.text }}>BengkelPro</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={() => onNav("login")}>Masuk</Btn>
          {!isMobile && <Btn size="sm" onClick={() => onNav("register")}>Daftar</Btn>}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: isMobile ? "36px 20px 32px" : "80px 60px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 60, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: `${theme.primary}12`, color: theme.primary, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, background: theme.primary, borderRadius: "50%", display: "inline-block" }} /> Buka Setiap Hari 07.00 – 21.00
          </div>
          <h1 style={{ fontSize: isMobile ? 30 : 46, fontWeight: 900, color: theme.text, lineHeight: 1.2, marginBottom: 14 }}>
            Servis Kendaraan <span style={{ color: theme.primary }}>Cepat,</span> Transparan & Terpercaya
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, lineHeight: 1.7, marginBottom: 24 }}>
            Pantau status kendaraan Anda secara real-time. Booking online, servis beres, bayar gampang. Sudah dipercaya 5.000+ pelanggan.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn size={isMobile ? "md" : "lg"} icon="calendar" onClick={() => onNav("customer")}>Booking Sekarang</Btn>
            <Btn variant="ghost" size={isMobile ? "md" : "lg"} onClick={() => onNav("login")}>Cek Status Servis</Btn>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 20 : 28, marginTop: 28 }}>
            {[["5K+", "Pelanggan"], ["98%", "Puas"], ["15+", "Mekanik Ahli"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: theme.text }}>{v}</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>




      </div>

      {/* SERVICES */}
      <div style={{ background: theme.bg, padding: isMobile ? "36px 20px" : "60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: theme.text, marginBottom: 8 }}>Layanan Kami</h2>
          <p style={{ color: theme.textMuted, marginBottom: 24, fontSize: isMobile ? 13 : 15 }}>Profesional, transparan, dan bergaransi</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16 }}>
            {services.map((s) => (
              <Card key={s.title} style={{ textAlign: "center", cursor: "pointer", transition: "box-shadow 0.2s", padding: isMobile ? 14 : 20 }}>
                <div style={{ width: isMobile ? 42 : 52, height: isMobile ? 42 : 52, background: `${theme.primary}12`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon name={s.icon} size={isMobile ? 20 : 24} color={theme.primary} />
                </div>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>{s.desc}</div>
                <div style={{ fontWeight: 800, color: theme.primary, fontSize: isMobile ? 12 : 15 }}>{s.price}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* LOCATION */}
      <div style={{ padding: isMobile ? "36px 20px" : "60px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 40, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: theme.text, marginBottom: 16 }}>Temukan Kami</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <Icon name="location" size={20} color={theme.primary} />
              <div>
                <div style={{ fontWeight: 600 }}>Alamat</div>
                <div style={{ color: theme.textMuted, fontSize: 13 }}>Jl. Bengkel Raya No. 12, Bandung, Jawa Barat</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
              <Icon name="phone" size={20} color={theme.primary} />
              <div>
                <div style={{ fontWeight: 600 }}>Telepon</div>
                <div style={{ color: theme.textMuted, fontSize: 13 }}>0812-3456-7890</div>
              </div>
            </div>
            <Btn icon="calendar" onClick={() => onNav("customer")}>Booking Sekarang</Btn>
          </div>
          <div style={{ height: isMobile ? 180 : 260, background: theme.bg, borderRadius: 18, border: `2px dashed ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <Icon name="location" size={36} color={theme.primary + "60"} />
            <span style={{ color: theme.textMuted, fontSize: 13 }}>Peta Lokasi Bengkel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
