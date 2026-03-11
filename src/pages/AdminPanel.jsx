import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Card, Btn, EmptyState } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const AdminPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("inventory");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "inventory", icon: "package", label: isMobile ? "Inventori" : "Inventori" },
    { id: "services",  icon: "wrench",  label: isMobile ? "Jasa" : "Manajemen Jasa" },
    { id: "users",     icon: "users",   label: isMobile ? "User" : "Manajemen User" },
  ];

  const [inventory, setInventory] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddInv, setShowAddInv] = useState(false);
  const [newInv, setNewInv] = useState({ name: "", code: "", buy_price: 0, sell_price: 0, stock: 0, min_stock: 5 });
  const [submittingInv, setSubmittingInv] = useState(false);

  const [showAddSvc, setShowAddSvc] = useState(false);
  const [newSvc, setNewSvc] = useState({ name: "", description: "", price: 0, duration: "1 Jam" });
  const [submittingSvc, setSubmittingSvc] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    if (page === "inventory") {
      const { data } = await supabase.from("inventory").select("*").order("name", { ascending: true });
      if (data) setInventory(data);
    } else if (page === "services") {
      const { data } = await supabase.from("services_catalog").select("*").order("name", { ascending: true });
      if (data) setServices(data);
    } else if (page === "users") {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) setUsers(data);
    }
    setLoading(false);
  };

  const handleAddInv = async () => {
    if (!newInv.name) return alert("Nama part wajib diisi!");
    setSubmittingInv(true);
    const code = newInv.code || "PRT-" + Math.floor(Math.random() * 10000);
    const { error } = await supabase.from("inventory").insert([{ ...newInv, code }]);
    setSubmittingInv(false);
    if (error) alert("Gagal: " + error.message);
    else {
      alert("Sparepart berhasil ditambahkan!");
      setShowAddInv(false);
      setNewInv({ name: "", code: "", buy_price: 0, sell_price: 0, stock: 0, min_stock: 5 });
      fetchData();
    }
  };

  const handleAddSvc = async () => {
    if (!newSvc.name || !newSvc.price) return alert("Nama dan Harga jasa wajib diisi!");
    setSubmittingSvc(true);
    const { error } = await supabase.from("services_catalog").insert([newSvc]);
    setSubmittingSvc(false);
    if (error) alert("Gagal: " + error.message);
    else {
      alert("Jasa berhasil ditambahkan!");
      setShowAddSvc(false);
      setNewSvc({ name: "", description: "", price: 0, duration: "1 Jam" });
      fetchData();
    }
  };

  const renderPage = () => {
    if (loading) return <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>Memuat data database...</div>;

    switch (page) {
      case "inventory":
        if (showAddInv) {
          return (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Tambah Sparepart Baru</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nama Part</div>
                  <input type="text" value={newInv.name} onChange={e => setNewInv({...newInv, name: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Kode Part (Opsional)</div>
                  <input type="text" value={newInv.code} onChange={e => setNewInv({...newInv, code: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Harga Beli (Rp)</div>
                  <input type="number" value={newInv.buy_price} onChange={e => setNewInv({...newInv, buy_price: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Harga Jual (Rp)</div>
                  <input type="number" value={newInv.sell_price} onChange={e => setNewInv({...newInv, sell_price: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Stok Awal</div>
                  <input type="number" value={newInv.stock} onChange={e => setNewInv({...newInv, stock: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Batas Min. Stok</div>
                  <input type="number" value={newInv.min_stock} onChange={e => setNewInv({...newInv, min_stock: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Btn style={{ flex: 1, justifyContent: "center" }} variant="outline" onClick={() => setShowAddInv(false)}>Batal</Btn>
                <Btn style={{ flex: 1, justifyContent: "center" }} onClick={handleAddInv} disabled={submittingInv}>{submittingInv ? "Loading..." : "Simpan"}</Btn>
              </div>
            </Card>
          );
        }

        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "9px 14px", flex: 1, marginRight: 10 }}>
                <Icon name="search" size={14} color={theme.textMuted} />
                <input placeholder="Cari sparepart..." style={{ border: "none", outline: "none", fontSize: 13, width: "100%", fontFamily: "'Sora', sans-serif" }} />
              </div>
              <Btn icon="plus" size={isMobile ? "sm" : "md"} onClick={() => setShowAddInv(true)}>{isMobile ? "" : "Tambah Item"}</Btn>
            </div>

            {isMobile ? (
              <div>
                {inventory.length === 0 ? (
                  <EmptyState icon="package" title="Belum ada data inventori" desc="Tambahkan sparepart untuk memulai" />
                ) : inventory.map((item) => (
                  <Card key={item.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>{item.code}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: item.stock <= item.min_stock ? theme.danger : theme.text }}>{item.stock}</span>
                        {item.stock <= item.min_stock && <Icon name="alert" size={14} color={theme.danger} />}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>Beli: Rp {item.buy_price.toLocaleString()}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary }}>Jual: Rp {item.sell_price.toLocaleString()}</div>
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
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.8fr", gap: 12, padding: "12px 16px", background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                      {["Nama Part", "Kode", "Harga Beli", "Harga Jual", "Stok"].map((h) => (
                        <div key={h} style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                      ))}
                    </div>
                    {inventory.map((item) => (
                      <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.8fr", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div></div>
                        <div style={{ fontSize: 12, color: theme.textMuted }}>{item.code}</div>
                        <div style={{ fontSize: 13 }}>Rp {item.buy_price.toLocaleString()}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Rp {item.sell_price.toLocaleString()}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: item.stock <= item.min_stock ? theme.danger : theme.text }}>{item.stock}</span>
                          {item.stock <= item.min_stock && <Icon name="alert" size={14} color={theme.danger} />}
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
        if (showAddSvc) {
          return (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Tambah Jasa Baru</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nama Jasa</div>
                <input type="text" placeholder="Cth: Ganti Oli Mesin" value={newSvc.name} onChange={e => setNewSvc({...newSvc, name: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Deskripsi (Opsional)</div>
                <input type="text" placeholder="Cth: Termasuk cek rantai" value={newSvc.description} onChange={e => setNewSvc({...newSvc, description: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Harga (Rp)</div>
                  <input type="number" value={newSvc.price} onChange={e => setNewSvc({...newSvc, price: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Estimasi Durasi</div>
                  <input type="text" value={newSvc.duration} onChange={e => setNewSvc({...newSvc, duration: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn style={{ flex: 1, justifyContent: "center" }} variant="outline" onClick={() => setShowAddSvc(false)}>Batal</Btn>
                <Btn style={{ flex: 1, justifyContent: "center" }} onClick={handleAddSvc} disabled={submittingSvc}>{submittingSvc ? "Loading..." : "Simpan"}</Btn>
              </div>
            </Card>
          )
        }

        return (
          <div>
            <div style={{ display: "flex", justify-content: "flex-end", marginBottom: 16 }}>
              <Btn icon="plus" onClick={() => setShowAddSvc(true)}>Tambah Jasa</Btn>
            </div>
            {isMobile ? (
              <div>
                {services.length === 0 ? (
                  <EmptyState icon="wrench" title="Belum ada data jasa" desc="Tambahkan jasa servis untuk memulai" />
                ) : services.map((s) => (
                  <Card key={s.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{s.description} · {s.duration}</div>
                        <div style={{ fontWeight: 700, color: theme.primary }}>Rp {s.price.toLocaleString()}</div>
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
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 12, padding: "12px 16px", background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                    {["Nama Jasa", "Deskripsi", "Harga", "Durasi"].map((h) => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                    ))}
                  </div>
                  {services.map((s) => (
                    <div key={s.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{s.description}</div>
                      <div style={{ fontWeight: 700, color: theme.primary }}>Rp {s.price.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{s.duration}</div>
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
              <Btn icon="plus" onClick={() => alert("Pembuatan akun karyawan baru hanya dapat dilakukan melalui halaman Register utama untuk alasan keamanan (Validasi Password & Enkripsi). Silakan Keluar dan daftar.")}>Tambah User</Btn>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {users.length === 0 ? (
                <EmptyState icon="users" title="Belum ada user" desc="..." />
              ) : users.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ width: 38, height: 38, background: theme.primary + "20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: theme.primary, fontSize: 15, flexShrink: 0 }}>
                    {(u.full_name || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{u.full_name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.phone || "No HP Kosong"}</div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.role === "kasir" ? theme.info + "15" : u.role === "mekanik" ? theme.accent + "15" : u.role === "admin" ? theme.primary + "15" : theme.danger + "15", color: u.role === "kasir" ? theme.info : u.role === "mekanik" ? theme.accent : u.role === "admin" ? theme.primary : theme.danger }}>
                    {u.role.toUpperCase()}
                  </span>
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
      <Sidebar items={navItems} active={page} onSelect={setPage} role="admin" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={pageTitle} subtitle="Panel Administrator" userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default AdminPanel;
