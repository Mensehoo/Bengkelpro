import { useState } from "react";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Badge, Card, StatCard, EmptyState, Btn } from "../components/ui";
import { MobileHeader, MobileBottomNav } from "../components/layout";

const CustomerPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("dashboard");
  const navItems = [
    { id: "dashboard", icon: "home",     label: "Beranda" },
    { id: "booking",   icon: "calendar", label: "Booking" },
    { id: "garage",    icon: "car",      label: "Garasi Saya" },
    { id: "history",   icon: "history",  label: "Riwayat" },
  ];

  const vehicles = [];
  const history = [];

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "#fff" }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Selamat datang 👋</div>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>Kendaraan dalam servis</div>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔧</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tidak ada kendaraan dalam servis</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Buat booking untuk mulai servis</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Servis" value="0x"  icon="wrench" color={theme.primary} />
              <StatCard label="Kendaraan"    value="0"   icon="car"    color={theme.info} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Aktivitas Terbaru</div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: theme.textMuted }}>
                <div style={{ fontSize: 13 }}>Belum ada aktivitas servis</div>
              </div>
            ) : history.slice(0, 2).map((h, i) => (
              <Card key={i} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.service}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>{h.vehicle} · {h.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: theme.primary, fontSize: 13 }}>{h.total}</div>
                  <Badge status={h.status} />
                </div>
              </Card>
            ))}
          </div>
        );

      case "booking":
        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>Pilih Kendaraan</div>
              {vehicles.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", border: `2px solid ${i === 0 ? theme.primary : theme.border}`, borderRadius: 12, marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, background: v.color + "20", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="car" size={20} color={v.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{v.plate}</div>
                  </div>
                  {i === 0 && <div style={{ marginLeft: "auto", width: 18, height: 18, background: theme.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={12} color="#fff" />
                  </div>}
                </div>
              ))}
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Pilih Tanggal & Jam</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 14 }}>
                {["S","M","S","R","K","J","S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>{d}</div>)}
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: i === 11 ? theme.primary : i === 5 || i === 12 ? theme.bg : "transparent", color: i === 11 ? "#fff" : i === 5 || i === 12 ? theme.textMuted : theme.text, fontWeight: i === 11 ? 700 : 400 }}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"].map((t, i) => (
                  <div key={t} style={{ textAlign: "center", padding: "8px", borderRadius: 8, border: `1.5px solid ${i === 1 ? theme.primary : theme.border}`, fontSize: 12, cursor: "pointer", color: i === 1 ? theme.primary : theme.text, fontWeight: i === 1 ? 700 : 400, background: i === 1 ? `${theme.primary}10` : "#fff" }}>
                    {t}
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Deskripsi Keluhan</div>
              <textarea placeholder="Ceritakan keluhan kendaraan Anda..." style={{ width: "100%", minHeight: 100, border: `1.5px solid ${theme.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Sora', sans-serif" }} />
            </Card>
            <Btn style={{ width: "100%", justifyContent: "center" }} size="lg" icon="check">Konfirmasi Booking</Btn>
          </div>
        );

      case "garage":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>{vehicles.length} Kendaraan</div>
              <Btn size="sm" icon="plus">Tambah</Btn>
            </div>
            {vehicles.length === 0 ? (
              <EmptyState icon="car" title="Belum ada kendaraan" desc="Tambahkan kendaraan Anda untuk mulai booking servis" action="+ Tambah Kendaraan" />
            ) : vehicles.map((v, i) => (
              <Card key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, background: v.color + "15", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="car" size={30} color={v.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>{v.plate} · {v.type}</div>
                    <Badge status={v.status} />
                  </div>
                  <Icon name="arrow_right" size={16} color={theme.textMuted} />
                </div>
              </Card>
            ))}
          </div>
        );

      case "history":
        return history.length > 0 ? (
          <div>
            {history.map((h, i) => (
              <Card key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{h.service}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{h.vehicle} · {h.date}</div>
                  </div>
                  <Badge status={h.status} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${theme.border}`, paddingTop: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 800, color: theme.primary }}>{h.total}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn size="sm" variant="ghost" icon="eye">Detail</Btn>
                    <Btn size="sm" variant="outline" icon="whatsapp">Nota</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : <EmptyState icon="history" title="Belum ada riwayat servis" desc="Riwayat servis kendaraan Anda akan muncul di sini" />;

      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <MobileHeader title="BengkelPro" onLogout={onLogout} />
      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
          {navItems.find(n => n.id === page)?.label}
        </div>
        <div style={{ color: theme.textMuted, fontSize: 13, marginBottom: 20 }}>Halo, {userName || "Pelanggan"}</div>
        {renderPage()}
      </div>
      <MobileBottomNav items={navItems} active={page} onSelect={setPage} />
    </div>
  );
};

export default CustomerPanel;
