import { useState } from "react";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Badge, Card, Btn } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const MekanikPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("tugas");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "tugas", icon: "list",    label: "Tugas" },
    { id: "parts", icon: "package", label: "Parts" },
  ];
  const navItemsFull = [
    { id: "tugas", icon: "list",    label: "Tugas Saya" },
    { id: "parts", icon: "package", label: "Input Part" },
  ];
  const tasks = [];
  const parts = [];

  const renderPage = () => {
    switch (page) {
      case "tugas":
        return (
          <div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: theme.textMuted }}>
                <Icon name="list" size={48} color={theme.border} />
                <div style={{ marginTop: 16, fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada tugas</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Tugas servis akan muncul di sini</div>
              </div>
            ) : tasks.map((t) => (
              <Card key={t.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50, background: theme.primary + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="car" size={isMobile ? 20 : 24} color={theme.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 15 }}>{t.vehicle}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{t.plate}</div>
                    </div>
                  </div>
                  <Badge status={t.status} />
                </div>
                <div style={{ background: theme.bg, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 2 }}>Pelanggan: {t.name}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>📋 {t.service}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {t.status === "waiting" ? (
                    <Btn style={{ justifyContent: "center", gridColumn: "span 2" }} icon="wrench">🔧 Mulai Kerjakan</Btn>
                  ) : (
                    <>
                      <Btn variant="ghost" icon="package" style={{ justifyContent: "center" }} onClick={() => setPage("parts")}>Input Part</Btn>
                      <Btn variant="success" icon="check" style={{ justifyContent: "center", background: theme.success }}>✓ Selesai</Btn>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        );

      case "parts":
        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Cari Sparepart</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", background: theme.bg, borderRadius: 10, padding: "10px 14px", border: `1.5px solid ${theme.border}` }}>
                <Icon name="search" size={16} color={theme.textMuted} />
                <input placeholder="Ketik nama atau kode part..." style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "'Sora', sans-serif" }} />
              </div>
            </Card>
            {parts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
                <Icon name="package" size={48} color={theme.border} />
                <div style={{ marginTop: 16, fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data parts</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Data sparepart akan muncul di sini</div>
              </div>
            ) : parts.map((p, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, background: theme.accent + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="package" size={20} color={theme.accent} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{p.code} · Stok: {p.stock}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: theme.primary }}>{p.price}</div>
                    </div>
                  </div>
                  <Btn size="sm" icon="plus">Pakai</Btn>
                </div>
              </Card>
            ))}
          </div>
        );

      default: return null;
    }
  };

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <MobileHeader title="BengkelPro" onLogout={onLogout} />
        <div style={{ padding: "16px 16px" }}>
          <MobilePageTitle title={page === "tugas" ? "Tugas Saya" : "Input Part"} subtitle="Halo, Mekanik Andi 👋" />
          {renderPage()}
        </div>
        <MobileBottomNav items={navItems} active={page} onSelect={setPage} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar items={navItemsFull} active={page} onSelect={setPage} role="mekanik" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={navItemsFull.find(n => n.id === page)?.label} subtitle={`Halo, ${userName || 'Mekanik'} 👋`} userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default MekanikPanel;
