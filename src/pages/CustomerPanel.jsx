import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import Icon from "../components/Icon";
import { Badge, Card, StatCard, EmptyState, Btn } from "../components/ui";
import { MobileHeader, MobileBottomNav } from "../components/layout";

const CustomerPanel = ({ onLogout, userName, userId }) => {
  const [page, setPage] = useState("dashboard");
  const navItems = [
    { id: "dashboard", icon: "home",     label: "Beranda" },
    { id: "booking",   icon: "calendar", label: "Booking" },
    { id: "garage",    icon: "car",      label: "Garasi" },
    { id: "history",   icon: "history",  label: "Riwayat" },
  ];

  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Tambah Kendaraan
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: "", plate: "", type: "Motor", color: "#FF4757" });
  const [submittingV, setSubmittingV] = useState(false);

  // Form Booking
  const [booking, setBooking] = useState({ vehicle_id: "", date: "", time: "", complaint: "" });
  const [submittingB, setSubmittingB] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchVehicles();
      fetchHistory();
    }
  }, [userId, page]);

  const fetchVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
    if (data) setVehicles(data);
  };

  const fetchHistory = async () => {
    const { data } = await supabase.from("service_orders").select("*, vehicles(name, plate)").eq("customer_id", userId).order("created_at", { ascending: false });
    if (data) setHistory(data);
    setLoading(false);
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.name || !newVehicle.plate) return alert("Nama dan Plat nomor wajib diisi!");
    setSubmittingV(true);
    const { error } = await supabase.from("vehicles").insert([{ ...newVehicle, owner_id: userId }]);
    setSubmittingV(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Kendaraan berhasil ditambahkan!");
      setShowAddVehicle(false);
      setNewVehicle({ name: "", plate: "", type: "Motor", color: "#FF4757" });
      fetchVehicles();
    }
  };

  const handleBooking = async () => {
    if (!booking.vehicle_id || !booking.date || !booking.time || !booking.complaint) return alert("Semua field wajib diisi!");
    setSubmittingB(true);
    // Kombinasikan tanggal dan jam
    const check_in_at = new Date(`${booking.date}T${booking.time}:00`).toISOString();
    
    const { error } = await supabase.from("service_orders").insert([{
      customer_id: userId,
      vehicle_id: booking.vehicle_id,
      complaint: booking.complaint,
      status: "waiting",
      check_in_at
    }]);
    
    setSubmittingB(false);
    if (error) {
      alert("Gagal Booking: " + error.message);
    } else {
      alert("Booking Servis Berhasil Dikirim!");
      setBooking({ vehicle_id: "", date: "", time: "", complaint: "" });
      setPage("history");
      fetchHistory();
    }
  };

  const activeOrders = history.filter(h => !["done", "paid", "cancelled"].includes(h.status));

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "#fff" }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Selamat datang 👋</div>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>Status Servis Saat Ini</div>
              
              {activeOrders.length === 0 ? (
                 <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
                   <div style={{ fontSize: 36, marginBottom: 8 }}>🔧</div>
                   <div style={{ fontWeight: 600, fontSize: 14 }}>Tidak ada kendaraan dalam servis</div>
                   <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Buat booking antrian servis baru dari tab Booking</div>
                 </div>
              ) : (
                activeOrders.map(o => (
                  <div key={o.id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700 }}>{o.vehicles?.name} ({o.vehicles?.plate})</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Keluhan: {o.complaint}</div>
                    <Badge status={o.status} />
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Servis" value={history.length} icon="wrench" color={theme.primary} />
              <StatCard label="Kendaraan"    value={vehicles.length} icon="car"    color={theme.info} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Aktivitas Terbaru</div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: theme.textMuted }}>
                <div style={{ fontSize: 13 }}>Belum ada aktivitas servis</div>
              </div>
            ) : history.slice(0, 3).map((h) => (
              <Card key={h.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{h.vehicles?.name}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{formatDate(h.created_at)}</div>
                  </div>
                  <Badge status={h.status} />
                </div>
              </Card>
            ))}
          </div>
        );

      case "booking":
        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>1. Pilih Kendaraan</div>
              {vehicles.length === 0 ? (
                <div style={{ fontSize: 12, color: theme.danger, marginBottom: 10 }}>Silakan tambah kendaraan dulu di menu Garasi.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {vehicles.map(v => (
                    <div key={v.id} onClick={() => setBooking({...booking, vehicle_id: v.id})} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", border: `2px solid ${booking.vehicle_id === v.id ? theme.primary : theme.border}`, borderRadius: 12, cursor: "pointer" }}>
                      <div style={{ width: 40, height: 40, background: (v.color || theme.primary) + "20", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="car" size={20} color={v.color || theme.primary} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>{v.plate}</div>
                      </div>
                      {booking.vehicle_id === v.id && (
                        <div style={{ marginLeft: "auto", width: 18, height: 18, background: theme.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="check" size={12} color="#fff" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>2. Rencana Kedatangan</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" value={booking.date} onChange={e => setBooking({...booking, date: e.target.value})} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, outline: "none", fontFamily: "'Sora', sans-serif" }} min={new Date().toISOString().split('T')[0]} />
                <input type="time" value={booking.time} onChange={e => setBooking({...booking, time: e.target.value})} style={{ width: 120, padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, outline: "none", fontFamily: "'Sora', sans-serif" }} />
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>3. Keluhan / Permintaan</div>
              <textarea value={booking.complaint} onChange={e => setBooking({...booking, complaint: e.target.value})} placeholder="Contoh: Ganti oli mesin dan rem depan bunyi..." style={{ width: "100%", minHeight: 100, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Sora', sans-serif" }} />
            </Card>

            <Btn style={{ width: "100%", justifyContent: "center" }} size="lg" icon="check" onClick={handleBooking} disabled={submittingB || !booking.vehicle_id || !booking.date || !booking.time || !booking.complaint}>
              {submittingB ? "Memproses..." : "Konfirmasi Booking"}
            </Btn>
          </div>
        );

      case "garage":
        if (showAddVehicle) {
          return (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Tambah Kendaraan</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nama/Merk Kendaraan</div>
                <input type="text" placeholder="Cth: Honda Vario 150" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Plat Nomor</div>
                <input type="text" placeholder="Cth: D 1234 AB" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tipe</div>
                  <select value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, outline: "none" }}>
                    <option>Motor</option>
                    <option>Mobil</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Warna UI</div>
                  <input type="color" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} style={{ width: "100%", height: 38, border: "none", padding: 0, borderRadius: 8, cursor: "pointer" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn style={{ flex: 1, justifyContent: "center" }} variant="outline" onClick={() => setShowAddVehicle(false)}>Batal</Btn>
                <Btn style={{ flex: 1, justifyContent: "center" }} onClick={handleAddVehicle} disabled={submittingV}>{submittingV ? "Loading..." : "Simpan"}</Btn>
              </div>
            </Card>
          )
        }

        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>{vehicles.length} Kendaraan</div>
              <Btn size="sm" icon="plus" onClick={() => setShowAddVehicle(true)}>Tambah</Btn>
            </div>
            {vehicles.length === 0 ? (
              <EmptyState icon="car" title="Belum ada kendaraan" desc="Tambahkan kendaraan Anda untuk mulai booking servis" action="+ Tambah Kendaraan" onAction={() => setShowAddVehicle(true)} />
            ) : vehicles.map((v) => (
              <Card key={v.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, background: (v.color || theme.primary) + "15", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="car" size={30} color={v.color || theme.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>{v.plate} · {v.type}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "history":
        return history.length > 0 ? (
          <div>
            {history.map((h) => (
              <Card key={h.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{h.vehicles?.name}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{h.vehicles?.plate} · {formatDate(h.check_in_at)}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Keluhan: {h.complaint}</div>
                  </div>
                  <Badge status={h.status} />
                </div>
              </Card>
            ))}
          </div>
        ) : <EmptyState icon="history" title="Belum ada riwayat servis" desc="Riwayat servis kendaraan Anda akan muncul di sini" />;

      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <MobileHeader title="BengkelPro" onLogout={onLogout} />
      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
          {navItems.find(n => n.id === page)?.label}
        </div>
        <div style={{ color: theme.textMuted, fontSize: 13, marginBottom: 20 }}>Halo, {userName || "Pelanggan"}</div>
        {loading ? <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>Memuat database...</div> : renderPage()}
      </div>
      <MobileBottomNav items={navItems} active={page} onSelect={setPage} />
    </div>
  );
};

export default CustomerPanel;
