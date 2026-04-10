import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Badge, Card, Btn, EmptyState } from "../components/ui";
import useIsMobile from "../hooks/useIsMobile";

const MekanikPanel = ({ onLogout, userName, userId }) => {
  const [page, setPage] = useState("tugas");
  const isMobile = useIsMobile();

  const navItemsFull = [
    { id: "tugas", icon: "list", label: "Tugas Saya (SPK)" },
  ];

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [notesInput, setNotesInput] = useState({});
  const [orderItems, setOrderItems] = useState({});
  const [inventory, setInventory] = useState([]);

  const [showPartModal, setShowPartModal] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchInventory();
  }, [userId]);

  const fetchTasks = async () => {
    setLoading(true);
    // Fetch specifically assigned or processing tasks for THIS mechanic
    const { data } = await supabase
      .from("service_orders")
      .select("*, vehicles(id, name, plate), profiles!customer_id(full_name), services_catalog(name)")
      .in("status", ["assigned", "processing"])
      .eq("mechanic_id", userId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setTasks(data);
      
      const pIds = data.map(d => d.id);
      if (pIds.length > 0) {
        const { data: items } = await supabase.from("order_items").select("*").in("order_id", pIds);
        if (items) {
           const map = {};
           items.forEach(i => {
              if(!map[i.order_id]) map[i.order_id] = [];
              map[i.order_id].push(i);
           });
           setOrderItems(map);
        }
      }
      
      // Initialize local notes state
      const nState = {};
      data.forEach(d => nState[d.id] = d.inspection_notes || "");
      setNotesInput(nState);
    }
    setLoading(false);
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from("inventory").select("*").order("name");
    if (data) setInventory(data);
  };

  const mulaiKerjakan = async (orderId) => {
    await supabase.from("service_orders").update({ status: "processing", mechanic_status: "Dalam Proses Awal" }).eq("id", orderId);
    fetchTasks();
  };

  const slesaikanTugas = async (orderId) => {
    if(!confirm("Anda yakin kendaraan ini sudah selesai diperbaiki dan siap masuk ke Kasir?")) return;
    await supabase.from("service_orders").update({ status: "done", done_at: new Date().toISOString() }).eq("id", orderId);
    fetchTasks();
  };

  const simpanCatatan = async (orderId) => {
    await supabase.from("service_orders").update({ inspection_notes: notesInput[orderId] }).eq("id", orderId);
    alert("Catatan diagnosa berhasil disimpan.");
  };

  const updateProgress = async (orderId, newStatus) => {
    await supabase.from("service_orders").update({ mechanic_status: newStatus }).eq("id", orderId);
    setTasks(tasks.map(t => t.id === orderId ? { ...t, mechanic_status: newStatus } : t));
  };

  const addItemToOrder = async (orderId, p) => {
     if (p.stock <= 0) return alert("Stok part tidak tersedia!");
     const payload = { order_id: orderId, item_type: "part", name: p.name, qty: 1, unit_price: p.sell_price };
     const { error } = await supabase.from("order_items").insert([payload]);
     if (!error) {
        alert(p.name + " ditambahkan ke tagihan pelanggan.");
        setShowPartModal(null);
        fetchTasks(); // refresh tagging
     } else alert("Gagal: " + error.message);
  };

  const removeOrderItem = async (itemId) => {
     if(confirm("Batal gunakan item ini?")) {
        await supabase.from("order_items").delete().eq("id", itemId);
        fetchTasks();
     }
  }

  const bukaRiwayat = async (vehId) => {
     setShowHistoryModal(true);
     setLoadingHistory(true);
     const { data } = await supabase
       .from("service_orders")
       .select("*, services_catalog(name), mechanics:profiles!mechanic_id(full_name)")
       .eq("vehicle_id", vehId)
       .in("status", ["done", "paid"])
       .order("created_at", { ascending: false });
       
     if (data) setHistoryData(data);
     setLoadingHistory(false);
  }

  const renderPage = () => {
    if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Memuat SPK Anda...</div>;

    return (
      <div style={{ paddingBottom: 40 }}>
         {tasks.length === 0 ? <EmptyState icon="check_circle" title="Tidak ada antrian kerja" desc="Beristirahatlah, saat ini belum ada SPK dialokasikan ke Anda oleh Admin." /> :
          tasks.map(t => (
            <Card key={t.id} style={{ marginBottom: 16, borderTop: t.status === "assigned" ? `4px solid ${theme.info}` : `4px solid ${theme.primary}` }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                     <div style={{ fontWeight: 800, fontSize: 16 }}>{t.vehicles?.name} ({t.vehicles?.plate})</div>
                     <div style={{ fontSize: 13, color: theme.textMuted }}>Pelanggan: {t.profiles?.full_name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
                     <Badge status={t.status === "assigned" ? "Menunggu Dikerjakan" : "Sedang Dikerjakan"} />
                     <Btn size="sm" variant="outline" icon="clock" onClick={() => bukaRiwayat(t.vehicles?.id)}>Lihat Riwayat</Btn>
                  </div>
               </div>

               <div style={{ background: theme.bg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 4 }}>Instruksi dari Admin / Pelanggan:</div>
                  <div style={{ fontSize: 14 }}><strong>Layanan:</strong> {t.services_catalog?.name || "-"}</div>
                  <div style={{ fontSize: 14 }}><strong>Keluhan:</strong> {t.complaint || "-"}</div>
               </div>

               {t.status === "assigned" ? (
                  <Btn style={{ width: "100%", justifyContent: "center" }} icon="tool" onClick={() => mulaiKerjakan(t.id)}>Terima & Mulai Pengerjaan</Btn>
               ) : (
                  <div>
                     {/* FITUR DIAGNOSA */}
                     <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Catatan Diagnosa / Pemeriksaan Mekanik:</div>
                        <div style={{ display: "flex", gap: 8 }}>
                           <textarea value={notesInput[t.id]} onChange={e => setNotesInput({...notesInput, [t.id]: e.target.value})} rows={2} placeholder="Tulis kerusakan yang ditemukan..." style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: "inherit" }} />
                           <Btn onClick={() => simpanCatatan(t.id)}>Simpan</Btn>
                        </div>
                     </div>

                     {/* PROGRESS BERKALA */}
                     <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Pembaruan Progress Internal:</div>
                        <select value={t.mechanic_status || "Dalam Proses Awal"} onChange={e => updateProgress(t.id, e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, width: "100%", outline: "none" }}>
                           {["Dalam Proses Awal", "Bongkar Mesin", "Menunggu Sparepart", "Pengecekan Akhir / Testing", "Cuci Board"].map(opt => <option key={opt}>{opt}</option>)}
                        </select>
                     </div>

                     {/* ALOKASI SPAREPART */}
                     <div style={{ marginBottom: 16, border: `1px dashed ${theme.border}`, padding: 12, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                           <div style={{ fontSize: 12, fontWeight: 700 }}>Alokasi Suku Cadang Terpakai:</div>
                           <Btn size="sm" variant="outline" icon="plus" onClick={() => setShowPartModal(t.id)}>Tambah Part</Btn>
                        </div>
                        {(!orderItems[t.id] || orderItems[t.id].length === 0) ? <div style={{ fontSize: 12, color: theme.textMuted }}>Belum ada part dimasukkan...</div> :
                           orderItems[t.id].filter(i => i.item_type === "part").map(i => (
                             <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${theme.bg}`, fontSize: 13 }}>
                                <span>1x {i.name}</span>
                                <div style={{ display: "flex", gap: 12 }}>
                                   <span style={{ fontWeight: 600 }}>Rp {i.unit_price.toLocaleString()}</span>
                                   <Icon name="x" size={16} color={theme.danger} style={{cursor:"pointer"}} onClick={() => removeOrderItem(i.id)} />
                                </div>
                             </div>
                           ))
                        }
                     </div>

                     <Btn style={{ width: "100%", justifyContent: "center", background: theme.success, border: "none", color: "#fff" }} icon="check" onClick={() => slesaikanTugas(t.id)}>Selesai Perbaikan Servis</Btn>
                  </div>
               )}
            </Card>
          ))
         }

         {/* PART MODAL (INLINE) */}
         {showPartModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
               <Card style={{ width: "90%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                     <div style={{ fontWeight: 800 }}>Pilih Part Tambahan</div>
                     <Icon name="x" size={20} color={theme.textMuted} onClick={() => setShowPartModal(null)} style={{cursor: "pointer"}} />
                  </div>
                  {inventory.map(p => (
                     <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${theme.bg}` }}>
                        <div>
                           <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                           <div style={{ fontSize: 11, color: theme.textMuted }}>Rp {p.sell_price.toLocaleString()} (Stok: {p.stock})</div>
                        </div>
                        <Btn size="sm" onClick={() => addItemToOrder(showPartModal, p)} disabled={p.stock <= 0}>Pakai</Btn>
                     </div>
                  ))}
               </Card>
            </div>
         )}

         {/* HISTORY MODAL (INLINE) */}
         {showHistoryModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
               <Card style={{ width: "90%", maxWidth: 450, maxHeight: "80vh", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                     <div style={{ fontWeight: 800 }}>Riwayat Servis Kendaraan</div>
                     <Icon name="x" size={20} color={theme.textMuted} onClick={() => setShowHistoryModal(null)} style={{cursor: "pointer"}} />
                  </div>
                  {loadingHistory ? <div>Memuat history...</div> : historyData.length === 0 ? <div style={{color: theme.textMuted, fontSize: 13}}>Tidak ada riwayat. Ini kunjungan pertama ke bengkel.</div> :
                     historyData.map(h => (
                        <div key={h.id} style={{ marginBottom: 16, border: `1px solid ${theme.border}`, padding: 12, borderRadius: 8 }}>
                           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{new Date(h.created_at).toLocaleDateString('id-ID')}</div>
                              <div style={{ fontSize: 11, color: theme.primary, fontWeight: 700 }}>{h.status.toUpperCase()}</div>
                           </div>
                           <div style={{ fontSize: 12 }}><strong>Keluhan:</strong> {h.complaint}</div>
                           <div style={{ fontSize: 12 }}><strong>Layanan:</strong> {h.services_catalog?.name}</div>
                           <div style={{ fontSize: 12 }}><strong>Teknisi:</strong> {h.mechanics?.full_name}</div>
                           {h.inspection_notes && <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic", color: theme.textMuted }}>"{h.inspection_notes}"</div>}
                        </div>
                     ))
                  }
               </Card>
            </div>
         )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <MobileHeader title="BengkelPro" onLogout={onLogout} />
        <div style={{ padding: "16px 16px" }}>
          <MobilePageTitle title="Tugas Mekanik" subtitle={`Halo, Mekanik ${userName || ''} 👋`} />
          {renderPage()}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar items={navItemsFull} active={page} onSelect={setPage} role="mekanik" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title="Surat Perintah Kerja" subtitle={`Halo, Mekanik ${userName || ''} 👋`} userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default MekanikPanel;
