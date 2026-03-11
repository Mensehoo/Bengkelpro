import { useState } from "react";
import { theme } from "../constants/theme";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Badge, Card, StatCard, Btn, Input } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const KasirPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("antrian");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "antrian", icon: "list",   label: "Antrian" },
    { id: "payment", icon: "dollar", label: "Bayar" },
    { id: "invoice", icon: "print",  label: "Invoice" },
  ];
  const antrian = [];

  const renderPage = () => {
    switch (page) {
      case "antrian":
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              <StatCard label="Total" value="0" icon="users" color={theme.primary} />
              <StatCard label="Selesai" value="0"  icon="check" color={theme.success} />
              {!isMobile && <StatCard label="Antrian" value="0" icon="list" color={theme.warning} />}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Input placeholder="Cari nama / plat nomor..." />
            </div>
            {antrian.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: theme.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada antrian hari ini</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Antrian servis akan muncul di sini</div>
              </div>
            ) : antrian.map((a) => (
              <Card key={a.no} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 34, height: 34, background: theme.primary + "15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: theme.primary, fontSize: 14, flexShrink: 0 }}>
                    {a.no}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.vehicle}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{a.service} · {a.time}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                    <Badge status={a.status} />
                    {a.status === "finished" && <Btn size="sm" icon="dollar" onClick={() => setPage("payment")}>Bayar</Btn>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "payment":
        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Detail Servis</div>
              <div style={{ marginBottom: 6, fontSize: 13, color: theme.textMuted }}>Pilih antrian yang sudah selesai dari halaman Antrian</div>
              <div style={{ textAlign: "center", padding: "30px 0", color: theme.textMuted }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
                <div style={{ fontSize: 13 }}>Belum ada transaksi dipilih</div>
              </div>
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Metode Pembayaran</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {["Tunai", "Transfer", "QRIS", "EDC"].map((m, i) => (
                  <div key={m} style={{ padding: "10px", border: `2px solid ${i === 0 ? theme.primary : theme.border}`, borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? theme.primary : theme.text, background: i === 0 ? `${theme.primary}10` : "#fff" }}>{m}</div>
                ))}
              </div>
              <Input label="Jumlah Uang Diterima" placeholder="Rp 0" />
            </Card>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setPage("invoice")}>Preview Invoice</Btn>
              <Btn style={{ flex: 1, justifyContent: "center" }} icon="check">Proses Bayar</Btn>
            </div>
          </div>
        );

      case "invoice":
        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ borderBottom: `2px dashed ${theme.border}`, paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: theme.primary }}>BengkelPro</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>Jl. Bengkel Raya No. 12, Bandung</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>INVOICE</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>#INV-{new Date().getFullYear()}-0001</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{new Date().toLocaleDateString("id-ID")}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "30px 0", color: theme.textMuted }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>Belum ada transaksi</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Proses pembayaran terlebih dahulu untuk melihat invoice</div>
              </div>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Btn variant="ghost" icon="print" style={{ justifyContent: "center" }}>Print</Btn>
              <Btn variant="success" icon="whatsapp" style={{ justifyContent: "center", background: "#25D366" }}>WhatsApp</Btn>
            </div>
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
          <MobilePageTitle
            title={navItems.find(n => n.id === page)?.label === "Antrian" ? "Antrian Hari Ini" : navItems.find(n => n.id === page)?.label}
            subtitle="Selasa, 10 Juni 2025"
          />
          {renderPage()}
        </div>
        <MobileBottomNav items={navItems} active={page} onSelect={setPage} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar items={[
        { id: "antrian", icon: "list",   label: "Antrian Hari Ini", badge: 5 },
        { id: "payment", icon: "dollar", label: "Pembayaran" },
        { id: "invoice", icon: "print",  label: "Cetak Invoice" },
      ]} active={page} onSelect={setPage} role="kasir" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={[
          { id: "antrian", label: "Antrian Hari Ini" },
          { id: "payment", label: "Pembayaran" },
          { id: "invoice", label: "Cetak Invoice" },
        ].find(n => n.id === page)?.label} subtitle="Manajemen Transaksi" userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default KasirPanel;
