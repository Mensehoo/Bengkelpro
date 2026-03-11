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

  const navItems = [
    { id: "tugas", icon: "list",    label: "Tugas" },
    { id: "parts", icon: "package", label: "Input Item" },
  ];
  const navItemsFull = [
    { id: "tugas", icon: "list",    label: "Tugas Saya" },
    { id: "parts", icon: "package", label: "Input Sparepart & Jasa" },
  ];

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Parts & Services Data
  const [inventory, setInventory] = useState([]);
  const [services, setServices] = useState([]);
  const [itemTypeTab, setItemTypeTab] = useState("part"); // "part" | "service"
  
  // Order items for active task
  const [orderItems, setOrderItems] = useState({});

  useEffect(() => {
    if (page === "tugas") fetchTasks();
    if (page === "parts") {
      fetchInventory();
      fetchServices();
    }
  }, [page, userId]);

  const fetchTasks = async () => {
    setLoading(true);
    // Fetch waiting tasks AND tasks processing by this mechanic
    const { data } = await supabase
      .from("service_orders")
      .select("*, vehicles(name, plate), profiles!customer_id(full_name)")
      .in("status", ["waiting", "processing"])
      .order("created_at", { ascending: true });
    
    if (data) {
      // Filter out processing tasks that belong to OTHER mechanics
      const filtered = data.filter(d => d.status === "waiting" || (d.status === "processing" && d.mechanic_id === userId));
      setTasks(filtered);

      // Fetch order items for processing tasks
      const processingIds = filtered.filter(d => d.status === "processing").map(d => d.id);
      if (processingIds.length > 0) {
        const { data: items } = await supabase.from("order_items").select("*").in("order_id", processingIds);
        if (items) {
          const itemsMap = {};
          items.forEach(item => {
            if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
            itemsMap[item.order_id].push(item);
          });
          setOrderItems(itemsMap);
        }
      }
    }
    setLoading(false);
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from("inventory").select("*").order("name");
    if (data) setInventory(data);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("services_catalog").select("*").order("name");
    if (data) setServices(data);
  };

  const handleTerimaOrder = async (orderId) => {
    const { error } = await supabase.from("service_orders").update({
      status: "processing",
      mechanic_id: userId
    }).eq("id", orderId);

    if (error) alert("Gagal menerima tugas: " + error.message);
    else fetchTasks();
  };

  const handleSelesaikanOrder = async (orderId) => {
    if (!confirm("Yakin tugas ini sudah selesai dan siap dibayar ke Kasir?")) return;
    const { error } = await supabase.from("service_orders").update({
      status: "done",
      done_at: new Date().toISOString()
    }).eq("id", orderId);

    if (error) alert("Gagal menyelesaikan tugas: " + error.message);
    else fetchTasks();
  };

  const addItemToOrder = async (item, type) => {
    if (!activeOrderId) return alert("Pilih tugas/order terlebih dahulu dari menu Tugas!");
    
    // Validasi stok jika tipe part
    if (type === "part" && item.stock <= 0) return alert("Stok part ini habis!");

    const payload = {
      order_id: activeOrderId,
      item_type: type,
      name: item.name,
      qty: 1,
      unit_price: type === "part" ? item.sell_price : item.price
    };

    const { error } = await supabase.from("order_items").insert([payload]);
    
    if (error) {
      alert("Gagal menambahkan item: " + error.message);
    } else {
      alert(`${item.name} berhasil ditambahkan ke Order!`);
    }
  };

  const handleBukaInputParts = (orderId) => {
    setActiveOrderId(orderId);
    setPage("parts");
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const renderPage = () => {
    switch (page) {
      case "tugas":
        if (loading) return <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>Memuat tugas...</div>;
        return (
          <div>
            {tasks.length === 0 ? (
              <EmptyState icon="list" title="Belum ada tugas" desc="Tugas servis antrian akan muncul di sini" />
            ) : tasks.map((t) => (
              <Card key={t.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50, background: theme.primary + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="car" size={isMobile ? 20 : 24} color={theme.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 15 }}>{t.vehicles?.name}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{t.vehicles?.plate} · Masuk: {formatDate(t.check_in_at)}</div>
                    </div>
                  </div>
                  <Badge status={t.status} />
                </div>
                <div style={{ background: theme.bg, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>Pelanggan: <span style={{ fontWeight: 600, color: theme.text }}>{t.profiles?.full_name}</span></div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: theme.danger }}>Keluhan: {t.complaint}</div>
                </div>

                {t.status === "processing" && orderItems[t.id] && orderItems[t.id].length > 0 && (
                  <div style={{ marginBottom: 12, padding: "10px 14px", border: `1px solid ${theme.border}`, borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Item Terpakai</div>
                    {orderItems[t.id].map(item => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span>• {item.name}</span>
                        <span style={{ fontWeight: 600 }}>Rp {item.unit_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  {t.status === "waiting" ? (
                    <Btn style={{ flex: 1, justifyContent: "center" }} icon="wrench" onClick={() => handleTerimaOrder(t.id)}>🔧 Terima Tugas</Btn>
                  ) : (
                    <>
                      <Btn variant="outline" icon="plus" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleBukaInputParts(t.id)}>Tambah Item</Btn>
                      <Btn variant="success" icon="check" style={{ flex: 1, justifyContent: "center", background: theme.success, color: "#fff", border: "none" }} onClick={() => handleSelesaikanOrder(t.id)}>Selesai</Btn>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        );

      case "parts":
        if (!activeOrderId) {
          return (
             <EmptyState icon="alert" title="Belum Ada Order Aktif" desc="Pilih order yang sedang dikerjakan di menu 'Tugas' lalu klik Tambah Item." action="Kembali ke Tugas" onAction={() => setPage("tugas")} />
          );
        }

        const activeTask = tasks.find(t => t.id === activeOrderId);

        return (
          <div>
            <div style={{ background: theme.primary + "10", padding: "12px 16px", borderRadius: 12, marginBottom: 16, border: `1px solid ${theme.primary}30` }}>
              <div style={{ fontSize: 11, color: theme.primary, fontWeight: 700, textTransform: "uppercase" }}>Sedang Mengerjakan</div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{activeTask?.vehicles?.name} ({activeTask?.vehicles?.plate})</div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <Btn style={{ flex: 1, justifyContent: "center" }} variant={itemTypeTab === "part" ? "primary" : "outline"} onClick={() => setItemTypeTab("part")} icon="package">Sparepart</Btn>
              <Btn style={{ flex: 1, justifyContent: "center" }} variant={itemTypeTab === "service" ? "primary" : "outline"} onClick={() => setItemTypeTab("service")} icon="wrench">Jasa Servis</Btn>
            </div>

            {itemTypeTab === "part" ? (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", background: theme.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${theme.border}`, marginBottom: 16 }}>
                  <Icon name="search" size={16} color={theme.textMuted} />
                  <input placeholder="Cari part..." style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "'Sora', sans-serif" }} />
                </div>
                {inventory.length === 0 ? <div style={{textAlign: "center", padding: 20}}>Belum ada data barang. Admin belum menginput apa-apa.</div> : inventory.map((p) => (
                  <Card key={p.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 44, height: 44, background: theme.accent + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name="package" size={20} color={theme.accent} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: theme.textMuted }}>{p.code} · Stok: {p.stock}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: theme.primary }}>Rp {p.sell_price.toLocaleString()}</div>
                        </div>
                      </div>
                      <Btn size="sm" icon="plus" onClick={() => addItemToOrder(p, "part")} disabled={p.stock <= 0}>Pakai</Btn>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div>
                {services.length === 0 ? <div style={{textAlign: "center", padding: 20}}>Belum ada jasa tersedia. Admin belum menginput apa-apa.</div> : services.map((s) => (
                   <Card key={s.id} style={{ marginBottom: 10 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                         <div style={{ width: 44, height: 44, background: theme.info + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                           <Icon name="wrench" size={20} color={theme.info} />
                         </div>
                         <div>
                           <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                           <div style={{ fontSize: 11, color: theme.textMuted }}>{s.duration}</div>
                           <div style={{ fontSize: 12, fontWeight: 600, color: theme.primary }}>Rp {s.price.toLocaleString()}</div>
                         </div>
                       </div>
                       <Btn size="sm" icon="plus" onClick={() => addItemToOrder(s, "service")}>Pilih</Btn>
                     </div>
                   </Card>
                ))}
              </div>
            )}
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
          <MobilePageTitle title={page === "tugas" ? "Tugas Saya" : "Input Part"} subtitle={`Halo, Mekanik ${userName || ''} 👋`} />
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
        <TopBar title={navItemsFull.find(n => n.id === page)?.label} subtitle={`Halo, Mekanik ${userName || ''} 👋`} userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default MekanikPanel;
