import { useState } from "react";
import { theme } from "../constants/theme";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Badge, Card, StatCard, Btn, Input } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const KasirPanel = ({ onLogout }) => {
  const [page, setPage] = useState("antrian");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "antrian", icon: "list",   label: "Antrian", badge: 5 },
    { id: "payment", icon: "dollar", label: "Bayar" },
    { id: "invoice", icon: "print",  label: "Invoice" },
  ];
  const antrian = [
    { no: 1, name: "Budi Santoso",  vehicle: "Honda Vario 150 (D 1234 AB)", service: "Ganti Oli + Filter", status: "processing", time: "09:15" },
    { no: 2, name: "Siti Rahayu",   vehicle: "Yamaha Beat (B 7890 CD)",      service: "Servis Ringan",     status: "waiting",    time: "10:00" },
    { no: 3, name: "Ahmad Fauzi",   vehicle: "Honda Scoopy (D 4321 EF)",     service: "Turun Mesin",       status: "waiting",    time: "10:30" },
    { no: 4, name: "Rina Marlina",  vehicle: "Suzuki Address (D 9999 GH)",   service: "Ganti Ban",         status: "finished",   time: "08:00" },
  ];

  const renderPage = () => {
    switch (page) {
      case "antrian":
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              <StatCard label="Total" value="12" icon="users" color={theme.primary} />
              <StatCard label="Selesai" value="4"  icon="check" color={theme.success} />
              {!isMobile && <StatCard label="Antrian" value="8" icon="list" color={theme.warning} />}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Input placeholder="Cari nama / plat nomor..." />
            </div>
            {antrian.map((a) => (
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
              <div style={{ marginBottom: 6, fontSize: 13, color: theme.textMuted }}>Budi Santoso · Honda Vario 150</div>
              {[
                { label: "Ganti Oli Shell Helix", type: "Sparepart", price: 65000 },
                { label: "Filter Oli",             type: "Sparepart", price: 15000 },
                { label: "Jasa Ganti Oli",         type: "Jasa",      price: 35000 },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.border}`, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{item.type}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>Rp {item.price.toLocaleString()}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontWeight: 800, fontSize: 16 }}>
                <span>Total</span><span style={{ color: theme.primary }}>Rp 115.000</span>
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
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: theme.success + "12", borderRadius: 10, border: `1px solid ${theme.success}30` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Kembalian</span>
                <span style={{ fontWeight: 800, color: theme.success, fontSize: 16 }}>Rp 35.000</span>
              </div>
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
                    <div style={{ fontSize: 11, color: theme.textMuted }}>#INV-2025-0042</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>10 Jun 2025</div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: theme.textMuted }}>Pelanggan</div>
                <div style={{ fontWeight: 700 }}>Budi Santoso</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>Honda Vario 150 · D 1234 AB</div>
              </div>
              {[
                { label: "Ganti Oli Shell Helix", qty: 1, price: 65000 },
                { label: "Filter Oli",             qty: 1, price: 15000 },
                { label: "Jasa Ganti Oli",         qty: 1, price: 35000 },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${theme.border}`, fontSize: 12 }}>
                  <span>{item.label} (×{item.qty})</span>
                  <span style={{ fontWeight: 600 }}>Rp {item.price.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontWeight: 800, borderTop: `2px solid ${theme.text}` }}>
                <span>TOTAL</span><span>Rp 115.000</span>
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: theme.textMuted, textAlign: "center" }}>Terima kasih atas kepercayaan Anda! 🙏</div>
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
      ]} active={page} onSelect={setPage} role="kasir" onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={[
          { id: "antrian", label: "Antrian Hari Ini" },
          { id: "payment", label: "Pembayaran" },
          { id: "invoice", label: "Cetak Invoice" },
        ].find(n => n.id === page)?.label} subtitle="Selasa, 10 Juni 2025" />
        {renderPage()}
      </div>
    </div>
  );
};

export default KasirPanel;
