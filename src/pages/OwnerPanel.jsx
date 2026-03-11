import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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

  const mechColors = [theme.primary, theme.info, theme.accent, theme.warning];

  const [loading, setLoading] = useState(true);

  // Revenue Data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [revenueChart, setRevenueChart] = useState({ months: [], data: [], max: 0 });

  // Mechanic Data
  const [mechanics, setMechanics] = useState([]);

  // Stock Data
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (page === "revenue") {
        const { data: invoices } = await supabase.from("invoices").select("*");
        if (invoices) {
          const totalRev = invoices.reduce((acc, curr) => acc + curr.total, 0);
          setTotalRevenue(totalRev);
          setTotalTransaksi(invoices.length);

          // Simple chart data grouping by Month (last 6 months logic simplified)
          const mData = {};
          invoices.forEach(inv => {
            if (inv.paid_at) {
              const d = new Date(inv.paid_at);
              const mName = d.toLocaleString('id-ID', { month: 'short' });
              mData[mName] = (mData[mName] || 0) + inv.total;
            }
          });
          const mKeys = Object.keys(mData);
          const mValues = Object.values(mData).map(v => v / 1000000); // dalam juta
          const maxVal = Math.max(...mValues, 1);
          setRevenueChart({ months: mKeys, data: mValues, max: maxVal });
        }
      } else if (page === "mechanic") {
        // Fetch profiles (role = mechanic) and service_orders
        const { data: mechs } = await supabase.from("profiles").select("*").eq("role", "mekanik");
        const { data: orders } = await supabase.from("service_orders").select("mechanic_id, status").eq("status", "done");
        
        if (mechs && orders) {
          const mList = mechs.map(m => {
            const jobs = orders.filter(o => o.mechanic_id === m.id).length;
            return {
              name: m.full_name,
              jobs: jobs,
              rating: (4.5 + Math.random() * 0.5).toFixed(1), // mock rating
              avgTime: "1.5 Jam" // mock time
            };
          }).sort((a,b) => b.jobs - a.jobs);
          setMechanics(mList);
        }
      } else if (page === "stock") {
        const { data: inventory } = await supabase.from("inventory").select("*").order("stock", { ascending: true });
        if (inventory) {
          const sList = inventory.map(inv => {
            let status = "Normal";
            if (inv.stock <= inv.min_stock) status = "hampir habis";
            else if (inv.stock > inv.min_stock * 3) status = "laku"; // pseudo logic
            return {
              ...inv,
              status
            };
          });
          setStocks(sList);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const renderPage = () => {
    if (loading) return <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>Memuat analitik data...</div>;

    switch (page) {
      case "revenue":
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 20 }}>
              <StatCard label={isMobile ? "Pendapatan" : "Total Pendapatan (Rp)"} value={`Rp ${totalRevenue.toLocaleString()}`} icon="dollar" color={theme.primary} />
              <StatCard label="Transaksi" value={totalTransaksi} icon="check" color={theme.info} />
            </div>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Grafik Pendapatan (Hitungan Kasar)</div>
              {revenueChart.months.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 13 }}>Belum ada data pendapatan</div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 6 : 12, height: isMobile ? 140 : 180, padding: "0 4px" }}>
                  {revenueChart.data.map((r, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: i === revenueChart.data.length - 1 ? theme.primary : theme.textMuted }}>{r.toFixed(1)}jt</div>
                      <div style={{ width: "100%", background: i === revenueChart.data.length - 1 ? theme.primary : `${theme.primary}30`, borderRadius: "4px 4px 0 0", height: `${(r / revenueChart.max) * (isMobile ? 100 : 140)}px`, transition: "all 0.3s" }} />
                      <div style={{ fontSize: 10, color: theme.textMuted }}>{revenueChart.months[i]}</div>
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
                <div style={{ fontSize: 13, marginTop: 6 }}>Buat minimal 1 akun role mekanik</div>
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
                        <div style={{ fontSize: 12, color: theme.textMuted }}>⭐ {m.rating}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: theme.textMuted }}>{m.jobs} pekerjaan diselesaikan</span>
                      <div style={{ flex: 1, marginLeft: 12, height: 6, background: theme.border, borderRadius: 10 }}>
                        <div style={{ width: mechanics[0].jobs > 0 ? `${(m.jobs / mechanics[0].jobs) * 100}%` : "0%", height: "100%", background: mechColors[i % mechColors.length], borderRadius: 10 }} />
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
            </div>
            <Card>
              {stocks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>Belum ada data stok</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Admin belum menambahkan sparepart</div>
                </div>
              ) : stocks.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < stocks.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                  <div style={{ width: 36, height: 36, background: theme.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="package" size={18} color={theme.textMuted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: theme.textMuted }}>Stok: <span style={{ fontWeight: 700, color: s.stock <= s.min_stock ? theme.danger : theme.text }}>{s.stock}</span> / Min: {s.min_stock}</span>
                    </div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: s.status === "hampir habis" ? theme.danger + "15" : theme.bg,
                    color: s.status === "hampir habis" ? theme.danger : theme.textMuted }}>
                    {s.status === "hampir habis" ? "⚠️ Hampir" : "Aman"}
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
