import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Card, Btn, EmptyState, StatCard } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const OwnerPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("dashboard");
  const isMobile = useIsMobile();

  const navItemsFull = [
    { id: "dashboard", icon: "home",    label: "Dashboard Eksekutif" },
    { id: "employees", icon: "users",   label: "Manajemen Hak Akses" },
    { id: "inventory", icon: "package", label: "Kelola Stok & Suku Cadang" },
    { id: "finances",  icon: "chart",   label: "Keuangan Internal" },
    { id: "backup",    icon: "save",    label: "Backup Basis Data" },
  ];
  
  const navItemsMobile = [
    { id: "dashboard", icon: "home",    label: "Dashboard" },
    { id: "employees", icon: "users",   label: "Staf" },
    { id: "inventory", icon: "package", label: "Inventori" },
    { id: "finances",  icon: "chart",   label: "Keuangan" },
  ];

  const [loading, setLoading] = useState(true);

  // Dash Stats
  const [stats, setStats] = useState({ totalCustomers: 0, totalRevenue: 0, completedServices: 0 });

  // Users Data
  const [users, setUsers] = useState([]);
  
  // Inventory
  const [inventory, setInventory] = useState([]);
  const [showInvForm, setShowInvForm] = useState(false);
  const [editInvId, setEditInvId] = useState(null);
  const [invForm, setInvForm] = useState({ name: "", buy_price: 0, sell_price: 0, stock: 0, min_stock: 5 });
  const [submittingInv, setSubmittingInv] = useState(false);

  // Finances
  const [invoices, setInvoices] = useState([]);
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth()); // 0-11
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());

  // Backup
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, filterBulan, filterTahun]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (page === "dashboard") {
         const [uRes, iRes, oRes] = await Promise.all([
             supabase.from("profiles").select("id", { count: "exact" }).eq("role", "pelanggan"),
             supabase.from("invoices").select("total"),
             supabase.from("service_orders").select("id", { count: "exact" }).in("status", ["done", "paid"])
         ]);
         
         const rev = iRes.data ? iRes.data.reduce((a,b) => a + b.total, 0) : 0;
         setStats({ totalCustomers: uRes.count || 0, totalRevenue: rev, completedServices: oRes.count || 0 });

      } else if (page === "employees") {
         const { data } = await supabase.from("profiles").select("*").order("role", { ascending: false });
         if (data) setUsers(data);

      } else if (page === "inventory") {
         const { data } = await supabase.from("inventory").select("*").order("name", { ascending: true });
         if (data) setInventory(data);

      } else if (page === "finances") {
         // Ambil invoices dan join order_items untuk menghitung pengeluaran part
         const startDate = new Date(filterTahun, filterBulan, 1).toISOString();
         const finishDate = new Date(filterTahun, filterBulan + 1, 1).toISOString();
         
         const { data } = await supabase.from("invoices")
            .select("*, service_orders( order_items(item_type, name, unit_price, qty) )")
            .gte("paid_at", startDate)
            .lt("paid_at", finishDate)
            .order("paid_at", { ascending: false });
            
         if (data) setInvoices(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // HANDLERS INVENTORY
  const simpanInventory = async () => {
      setSubmittingInv(true);
      let err;
      if (editInvId) {
          const { error } = await supabase.from("inventory").update(invForm).eq("id", editInvId);
          err = error;
      } else {
          const payload = { ...invForm, code: "PRT-" + Math.floor(Math.random() * 99999) };
          const { error } = await supabase.from("inventory").insert([payload]);
          err = error;
      }
      setSubmittingInv(false);
      if (err) alert("Gagal menyimpan: " + err.message);
      else {
          alert("Suku cadang tersimpan!");
          setShowInvForm(false);
          setInvForm({ name: "", buy_price: 0, sell_price: 0, stock: 0, min_stock: 5 });
          setEditInvId(null);
          fetchData();
      }
  };

  const hapusInventory = async (id) => {
      if(confirm("Yakin ingin menghapus part ini dari database?")) {
         await supabase.from("inventory").delete().eq("id", id);
         fetchData();
      }
  };

  // HANDLERS ROLE
  const ubahRole = async (userId, newRole) => {
      if(confirm(`Yakin merubah role pengguna ini menjadi ${newRole.toUpperCase()}?`)) {
          await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
          fetchData();
      }
  };

  // EXPORT FINANCES
  const exportFinances = () => {
     if (invoices.length === 0) return alert("Belum ada transaksi di bulan ini.");
     let csvContent = "data:text/csv;charset=utf-8,";
     
     // HEADER
     const headers = ["No Invoice", "Tanggal", "Pendapatan Kotor", "Estimasi HPP (Modal Part)", "Estimasi Laba Kotor"];
     csvContent += headers.join(",") + "\n";
     
     invoices.forEach(inv => {
         const tgl = new Date(inv.paid_at).toLocaleDateString("id-ID");
         const kotor = inv.total;
         
         // Hitung HPP (Modal Part) - Catatan: Karena db tidak menyimpan "Buy Price" historis part saat dibeli (hanya current di inventory), perhitungan ini kasar menggunakan asumsi order_items atau dummy margin. Tapi order_items ada 'unit_price' yang mana itu SELL price. Anggap modal flat 70% dari sell price untuk demonstrasi sederhana, karena skema awal tak mentracking HPP di order_items.
         let hppEstimasi = 0;
         if (inv.service_orders?.order_items) {
             const partsUsed = inv.service_orders.order_items.filter(i => i.item_type === "part");
             hppEstimasi = partsUsed.reduce((acc, curr) => acc + (curr.unit_price * curr.qty * 0.7), 0); // Asumsi 30% margin
         }
         
         const laba = kotor - hppEstimasi;
         
         csvContent += `${inv.invoice_number},"${tgl}",${kotor},${hppEstimasi},${laba}\n`;
     });

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     const mStr = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"][filterBulan];
     link.setAttribute("download", `Lap_Keuangan_BengkelPro_${mStr}_${filterTahun}.csv`);
     document.body.appendChild(link);
     link.click();
     link.remove();
  };

  // MANUAL BACKUP DATABASE
  const performDatabaseBackup = async () => {
     setBackingUp(true);
     try {
       const tNames = ["profiles", "inventory", "services_catalog", "service_orders", "invoices", "order_items"];
       const dumpArr = await Promise.all(tNames.map(t => supabase.from(t).select("*")));
       
       const dumpObj = { export_date: new Date().toISOString(), software: "BengkelPro v2", tables: {} };
       tNames.forEach((t, i) => { dumpObj.tables[t] = dumpArr[i].data; });
       
       const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dumpObj, null, 2));
       const link = document.createElement("a");
       link.setAttribute("href", dataStr);
       link.setAttribute("download", `DB_BACKUP_BengkelPro_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.json`);
       document.body.appendChild(link);
       link.click();
       link.remove();
     } catch (e) {
       alert("Error backup: " + e.message);
     }
     setBackingUp(false);
  }

  const renderPage = () => {
    if (loading) return <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>Memuat Data Sistem Eksekutif...</div>;

    switch (page) {
      case "dashboard":
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
               <StatCard label="Total Pendapatan" value={`Rp ${stats.totalRevenue.toLocaleString()}`} icon="dollar" color={theme.primary} />
               <StatCard label="Total Layanan Selesai" value={stats.completedServices} icon="check_circle" color={theme.success} />
               <StatCard label="Jumlah Pelanggan" value={stats.totalCustomers} icon="users" color={theme.info} />
            </div>

            <Card style={{ padding: 32, textAlign: "center", background: `linear-gradient(135deg, ${theme.bg}, ${theme.primary}10)` }}>
               <div style={{ fontSize: 40, marginBottom: 12 }}>👑</div>
               <div style={{ fontSize: 20, fontWeight: 800 }}>Halo, *Owner* BengkelPro!</div>
               <div style={{ fontSize: 13, color: theme.textMuted, maxWidth: 500, margin: "10px auto" }}>Anda mendarat di Command Center Utama. Melalui otoritas sistem ini, Anda dapat memantau pergerakan finansial, menata personel karyawan (admin, kasir, mekanik), maupun merestrukturisasi manajemen gudang Anda.</div>
            </Card>
          </div>
        );

      case "employees":
        return (
          <div>
             <div style={{ marginBottom: 16, fontSize: 13, color: theme.textMuted }}>Ubah kewenangan akses bagi pengguna yang sudah mendaftar di aplikasi secara mandiri (Ubah dari Pelanggan ke Mekanik / Kasir dsb).</div>
             {users.map(u => (
                <Card key={u.id} style={{ marginBottom: 10 }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                         <div style={{ fontWeight: 700, fontSize: 14 }}>{u.full_name || "Tanpa Nama"}</div>
                         <div style={{ fontSize: 11, color: theme.textMuted, opacity: 0.8 }}>ID: {u.id.substring(0,8)}...</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                         <span style={{ fontSize: 12, fontWeight: 800, color: u.role === "pelanggan" ? theme.textMuted : theme.primary }}>{u.role.toUpperCase()}</span>
                         <div style={{ width: 1, height: 20, background: theme.border }} />
                         <select value={u.role} onChange={(e) => ubahRole(u.id, e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", fontSize: 12 }}>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="kasir">Kasir</option>
                            <option value="mekanik">Mekanik</option>
                            <option value="pelanggan">Pelanggan</option>
                         </select>
                      </div>
                   </div>
                </Card>
             ))}
          </div>
        );

      case "inventory":
        if (showInvForm) {
            return (
               <Card>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{editInvId ? "Ubah Suku Cadang" : "Tambah Suku Cadang Baru"}</div>
                  <div style={{ marginBottom: 12 }}>
                     <label style={{ fontSize: 12, fontWeight: 700 }}>Nama Item</label>
                     <input type="text" value={invForm.name} onChange={e => setInvForm({...invForm, name: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}` }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Harga Beli (Modal)</label>
                        <input type="number" value={invForm.buy_price} onChange={e => setInvForm({...invForm, buy_price: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}` }} />
                     </div>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Harga Jual / Konsumen</label>
                        <input type="number" value={invForm.sell_price} onChange={e => setInvForm({...invForm, sell_price: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}` }} />
                     </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Stok Gudang (Qty)</label>
                        <input type="number" value={invForm.stock} onChange={e => setInvForm({...invForm, stock: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}` }} />
                     </div>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Batas Stok Minimum (Peringatan)</label>
                        <input type="number" value={invForm.min_stock} onChange={e => setInvForm({...invForm, min_stock: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}` }} />
                     </div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                     <Btn style={{flex:1, justifyContent:"center"}} variant="outline" onClick={() => {setShowInvForm(false); setEditInvId(null)}}>Batal</Btn>
                     <Btn style={{flex:1, justifyContent:"center"}} onClick={simpanInventory} disabled={submittingInv}>{submittingInv ? "Loading..." : "Simpan Suku Cadang"}</Btn>
                  </div>
               </Card>
            )
        }

        return (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
               <Btn icon="plus" onClick={() => { setInvForm({ name: "", buy_price: 0, sell_price: 0, stock: 0, min_stock: 5 }); setShowInvForm(true); }}>Tambah Suku Cadang</Btn>
            </div>
            {inventory.length === 0 ? <EmptyState icon="package" title="Tidak ada stok" desc="Gudang masih kosong. Tambahkan inventori baru." /> :
             inventory.map(i => (
               <Card key={i.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{i.name} <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, background: theme.border, padding: "2px 6px", borderRadius: 4 }}>{i.code}</span></div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Modal: Rp{i.buy_price.toLocaleString()} · Jual: Rp{i.sell_price.toLocaleString()}</div>
                     </div>
                     <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted }}>SAAT INI</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: i.stock <= i.min_stock ? theme.danger : theme.success }}>{i.stock} Pcs</div>
                     </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.bg}`, display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12, paddingTop: 12 }}>
                     <Btn size="sm" variant="outline" icon="edit-2" onClick={() => { setInvForm(i); setEditInvId(i.id); setShowInvForm(true); }}>Edit</Btn>
                     <Btn size="sm" variant="outline" color={theme.danger} onClick={() => hapusInventory(i.id)}>Hapus</Btn>
                  </div>
               </Card>
             ))
            }
          </div>
        );

      case "finances":
        return (
           <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, background: theme.bg, padding: 12, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                 <select value={filterBulan} onChange={e => setFilterBulan(parseInt(e.target.value))} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", outline: "none", fontWeight: 700 }}>
                    {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => <option key={i} value={i}>{m}</option>)}
                 </select>
                 <input type="number" value={filterTahun} onChange={e => setFilterTahun(parseInt(e.target.value))} style={{ width: 80, padding: 10, borderRadius: 8, border: "none", outline: "none", fontWeight: 700 }} />
              </div>
              
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                 <Btn icon="document" size="lg" style={{ background: theme.success, color: "#fff", border: "none" }} onClick={exportFinances}>Ekspor Laporan PDF / CSV (Excel)</Btn>
              </div>

              {invoices.length === 0 ? <EmptyState icon="chart" title="Nihil" desc="Tidak ada pemasukan / invoice tercatat pada bulan yang Anda pilih." /> :
                 invoices.map(inv => (
                   <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12, padding: "14px 16px", background: "#fff", borderBottom: `1px solid ${theme.border}`, alignItems: "center", borderRadius: 8, marginBottom: 8 }}>
                      <div>
                         <div style={{ fontWeight: 700, fontSize: 13 }}>{inv.invoice_number}</div>
                         <div style={{ fontSize: 11, color: theme.textMuted }}>{new Date(inv.paid_at).toLocaleDateString('id-ID')} · Lunas {inv.payment_method}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                         <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted }}>KOTOR</div>
                         <div style={{ fontWeight: 800, fontSize: 13, color: theme.primary }}>Rp {inv.total.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "right", background: theme.success+"15", padding: "6px 8px", borderRadius: 6 }}>
                         <div style={{ fontSize: 10, fontWeight: 700, color: theme.success }}>NETTO KASAR (+30%)</div>
                         <div style={{ fontWeight: 800, fontSize: 13, color: theme.success }}>~ Rp {(inv.total * 0.3).toLocaleString()}</div>
                      </div>
                   </div>
                 ))
              }
           </div>
        );

      case "backup":
        return (
           <div style={{ padding: 20 }}>
              <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: 40 }}>
                 <Icon name="database" size={48} color={theme.info} />
                 <div style={{ fontWeight: 800, fontSize: 20, margin: "16px 0 8px" }}>Amankan Data Basis Operasional Ke Local.</div>
                 <div style={{ fontSize: 13, color: theme.textMuted, maxWidth: 400, marginBottom: 24, lineHeight: 1.6 }}>Proses tindakan ini akan mengunduh seluruh informasi tabel bengkel (profil, suku cadang, rekam transaksi, dan invoice) yang ada di Supabase saat ini menjadi salinan format berkas standar ber-ekstensi `.json`. Pastikan simpan baik-baik file tersebut!</div>
                 
                 <Btn size="lg" icon="save" onClick={performDatabaseBackup} disabled={backingUp}>
                    {backingUp ? "Mengkalkulasi Seluruh Tabel Data..." : "Meminta Ekstraksi JSON (.json)"}
                 </Btn>
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
        <MobileHeader title="BengkelPro Eksekutif" onLogout={onLogout} />
        <div style={{ padding: "16px 16px" }}>
          <MobilePageTitle title={pageTitle} />
          {renderPage()}
        </div>
        <MobileBottomNav items={navItemsMobile} active={page} onSelect={setPage} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar items={navItemsFull} active={page} onSelect={setPage} role="owner" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={pageTitle} subtitle="Panel Tertinggi" userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default OwnerPanel;
