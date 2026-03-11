import { useState } from "react";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Card, StatCard } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const OwnerPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("revenue");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "revenue",  icon: "chart",   label: isMobile ? "Pendapatan" : "Pendapatan" },
    { id: "mechanic", icon: "star",    label: isMobile ? "Mekanik" : "Statistik Mekanik" },
    { id: "stock",    icon: "package", label: isMobile ? "Stok" : "Laporan Stok" },
  ];
  const navItemsFull = [
    { id: "revenue",  icon: "chart",   label: "Pendapatan" },
    { id: "mechanic", icon: "star",    label: "Statistik Mekanik" },
    { id: "stock",    icon: "package", label: "Laporan Stok" },
  ];

  const months   = [];
  const revenues  = [];
  const maxRev    = 1;
  const mechanics = [];
  const stocks    = [];

  const mechColors = [theme.primary, theme.info, theme.accent, theme.warning];

  const renderPage = () => {
    switch (page) {
      case "revenue":
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 20 }}>
              <StatCard label={isMobile ? "Pendapatan" : "Pendapatan Bulan Ini"} value="Rp 0" sub="Belum ada data" icon="dollar" color={theme.primary} />
              <StatCard label="Transaksi" value="0" sub="Belum ada data" icon="list" color={theme.info} />
              {!isMobile && <StatCard label="Pelanggan Baru" value="0" sub="Belum ada data" icon="users" color={theme.success} />}
            </div>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Grafik Pendapatan</div>
              {revenues.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 13 }}>Belum ada data pendapatan</div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 6 : 12, height: isMobile ? 140 : 180, padding: "0 4px" }}>
                  {revenues.map((r, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: i === revenues.length - 1 ? theme.primary : theme.textMuted }}>{r}jt</div>
                      <div style={{ width: "100%", background: i === revenues.length - 1 ? theme.primary : `${theme.primary}30`, borderRadius: "4px 4px 0 0", height: `${(r / maxRev) * (isMobile ? 100 : 140)}px`, transition: "all 0.3s" }} />
                      <div style={{ fontSize: 10, color: theme.textMuted }}>{months[i]}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        );

      case "mechanic":
        return (
          <div>
            {mechanics.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: theme.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data mekanik</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Data statistik mekanik akan muncul di sini</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 12 : 16 }}>
                {mechanics.map((m, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                      <div style={{ width: 46, height: 46, background: mechColors[i % mechColors.length] + "20", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: mechColors[i % mechColors.length], fontSize: 17, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: theme.textMuted }}>⭐ {m.rating} · {m.avgTime} rata-rata</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: theme.textMuted }}>{m.jobs} pekerjaan</span>
                      <div style={{ flex: 1, marginLeft: 12, height: 6, background: theme.border, borderRadius: 10 }}>
                        <div style={{ width: `${(m.jobs / mechanics[0].jobs) * 100}%`, height: "100%", background: mechColors[i % mechColors.length], borderRadius: 10 }} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "stock":
        return (
          <div>
            <div style={{ display: "flex", gap: isMobile ? 8 : 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ padding: "10px 14px", background: theme.danger + "12", borderRadius: 10, border: `1px solid ${theme.danger}30`, display: "flex", gap: 6, alignItems: "center" }}>
                <Icon name="alert" size={15} color={theme.danger} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.danger }}>{stocks.filter(s => s.status === "hampir habis").length} hampir habis</span>
              </div>
              <div style={{ padding: "10px 14px", background: theme.success + "12", borderRadius: 10, border: `1px solid ${theme.success}30`, display: "flex", gap: 6, alignItems: "center" }}>
                <Icon name="star" size={15} color={theme.success} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.success }}>{stocks.filter(s => s.status === "laku").length} terlaris</span>
              </div>
            </div>
            <Card>
              {stocks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>Belum ada data stok</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Data laporan stok akan muncul di sini</div>
                </div>
              ) : stocks.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < stocks.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                  <div style={{ width: 36, height: 36, background: theme.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="package" size={18} color={theme.textMuted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: theme.textMuted }}>Terjual: {s.sold}</span>
                      <span style={{ fontSize: 11, color: theme.textMuted }}>Stok: {s.stock}</span>
                    </div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: s.status === "laku" ? theme.success + "15" : s.status === "hampir habis" ? theme.danger + "15" : theme.bg,
                    color: s.status === "laku" ? theme.success : s.status === "hampir habis" ? theme.danger : theme.textMuted }}>
                    {s.status === "laku" ? "🔥 Terlaris" : s.status === "hampir habis" ? "⚠️ Hampir" : "Normal"}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        );

      default: return null;
    }
  };

  const pageTitle = navItemsFull.find(n => n.id === page)?.label;

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <MobileHeader title="BengkelPro" onLogout={onLogout} />
        <div style={{ padding: "16px 16px" }}>
          <MobilePageTitle title={pageTitle} subtitle="Business Intelligence" />
          {renderPage()}
        </div>
        <MobileBottomNav items={navItems} active={page} onSelect={setPage} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar items={navItemsFull} active={page} onSelect={setPage} role="owner" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={pageTitle} subtitle="Business Intelligence Dashboard" userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default OwnerPanel;
