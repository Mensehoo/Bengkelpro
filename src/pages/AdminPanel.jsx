import { useState } from "react";
import { theme, STATUS } from "../constants/theme";
import Icon from "../components/Icon";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Card, Btn } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const AdminPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("inventory");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "inventory", icon: "package", label: isMobile ? "Inventori" : "Inventori" },
    { id: "services",  icon: "wrench",  label: isMobile ? "Jasa" : "Manajemen Jasa" },
    { id: "users",     icon: "users",   label: isMobile ? "User" : "Manajemen User" },
  ];
  const inventory = [];
  const services  = [];
  const users     = [];

  const renderPage = () => {
    switch (page) {
      case "inventory":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "9px 14px", flex: 1, marginRight: 10 }}>
                <Icon name="search" size={14} color={theme.textMuted} />
                <input placeholder="Cari sparepart..." style={{ border: "none", outline: "none", fontSize: 13, width: "100%", fontFamily: "'Sora', sans-serif" }} />
              </div>
              <Btn icon="plus" size={isMobile ? "sm" : "md"}>{isMobile ? "" : "Tambah Item"}</Btn>
            </div>

            {isMobile ? (
              <div>
                {inventory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: theme.textMuted }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data inventori</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Tambahkan sparepart untuk memulai</div>
                  </div>
                ) : inventory.map((item, i) => (
                  <Card key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>{item.code}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: item.stock <= item.min ? theme.danger : theme.text }}>{item.stock}</span>
                        {item.stock <= item.min && <Icon name="alert" size={14} color={theme.danger} />}
                        <span style={{ fontSize: 11, color: theme.textMuted }}>stok</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>Beli: Rp {item.buy.toLocaleString()}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary }}>Jual: Rp {item.sell.toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" icon="edit" />
                        <Btn size="sm" variant="outline" style={{ color: theme.success, borderColor: theme.success }}>Restock</Btn>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div>
                {inventory.length === 0 ? (
                  <Card style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data inventori</div>
                    <div style={{ fontSize: 13, marginTop: 6, color: theme.textMuted }}>Tambahkan sparepart untuk memulai</div>
                  </Card>
                ) : (
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.8fr 1fr", gap: 12, padding: "12px 16px", background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                      {["Nama Part", "Kode", "Harga Beli", "Harga Jual", "Stok", "Aksi"].map((h) => (
                        <div key={h} style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                      ))}
                    </div>
                    {inventory.map((item, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.8fr 1fr", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div></div>
                        <div style={{ fontSize: 12, color: theme.textMuted }}>{item.code}</div>
                        <div style={{ fontSize: 13 }}>Rp {item.buy.toLocaleString()}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Rp {item.sell.toLocaleString()}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: item.stock <= item.min ? theme.danger : theme.text }}>{item.stock}</span>
                          {item.stock <= item.min && <Icon name="alert" size={14} color={theme.danger} />}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn size="sm" variant="ghost" icon="edit" />
                          <Btn size="sm" variant="outline" style={{ color: theme.success, borderColor: theme.success }}>Restock</Btn>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      case "services":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Btn icon="plus">Tambah Jasa</Btn>
            </div>
            {isMobile ? (
              <div>
                {services.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: theme.textMuted }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data jasa</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Tambahkan jasa servis untuk memulai</div>
                  </div>
                ) : services.map((s, i) => (
                  <Card key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{s.desc} · {s.duration}</div>
                        <div style={{ fontWeight: 700, color: theme.primary }}>Rp {s.price.toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" icon="edit" />
                        <Btn size="sm" variant="ghost" style={{ color: theme.danger }} icon="trash" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              services.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data jasa</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: theme.textMuted }}>Tambahkan jasa servis untuk memulai</div>
                </Card>
              ) : (
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 12, padding: "12px 16px", background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                    {["Nama Jasa", "Deskripsi", "Harga", "Durasi", "Aksi"].map((h) => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                    ))}
                  </div>
                  {services.map((s, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{s.desc}</div>
                      <div style={{ fontWeight: 700, color: theme.primary }}>Rp {s.price.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{s.duration}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" icon="edit" />
                        <Btn size="sm" variant="ghost" style={{ color: theme.danger }} icon="trash" />
                      </div>
                    </div>
                  ))}
                </Card>
              )
            )}
          </div>
        );

      case "users":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Btn icon="plus">Tambah User</Btn>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {users.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: theme.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>Belum ada data user</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Tambahkan kasir atau mekanik untuk memulai</div>
                </div>
              ) : users.map((u, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ width: 38, height: 38, background: theme.primary + "20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: theme.primary, fontSize: 15, flexShrink: 0 }}>
                    {u.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  {!isMobile && (
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.role === "kasir" ? theme.info + "15" : theme.accent + "15", color: u.role === "kasir" ? theme.info : theme.accent }}>
                      {u.role.toUpperCase()}
                    </span>
                  )}
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.status === "active" ? theme.success + "15" : theme.danger + "15", color: u.status === "active" ? theme.success : theme.danger, flexShrink: 0 }}>
                    {u.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <Btn size="sm" variant="ghost" icon="edit" />
                    {!isMobile && <Btn size="sm" variant="ghost" style={{ color: theme.danger }} icon="trash" />}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        );

      default: return null;
    }
  };

  const pageTitle = navItems.find(n => n.id === page)?.label;

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <MobileHeader title="BengkelPro" onLogout={onLogout} />
        <div style={{ padding: "16px 16px" }}>
          <MobilePageTitle title={pageTitle} subtitle="Panel Administrator" />
          {renderPage()}
        </div>
        <MobileBottomNav items={navItems} active={page} onSelect={setPage} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar items={[
        { id: "inventory", icon: "package", label: "Inventori" },
        { id: "services",  icon: "wrench",  label: "Manajemen Jasa" },
        { id: "users",     icon: "users",   label: "Manajemen User" },
      ]} active={page} onSelect={setPage} role="admin" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={pageTitle} subtitle="Panel Administrator" userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default AdminPanel;
