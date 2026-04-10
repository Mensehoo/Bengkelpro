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
    { id: "services",  icon: "list",     label: "Layanan" },
    { id: "booking",   icon: "calendar", label: "Booking" },
    { id: "garage",    icon: "car",      label: "Garasi" },
    { id: "history",   icon: "history",  label: "Riwayat" },
  ];

  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Tambah Kendaraan
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: "", plate: "", type: "Motor", color: "#FF4757" });
  const [submittingV, setSubmittingV] = useState(false);

  // Form Booking
  const [booking, setBooking] = useState({ vehicle_id: "", service_id: "", date: "", time: "", complaint: "" });
  const [submittingB, setSubmittingB] = useState(false);

  // Toast / Notifikasi
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  // Upload state
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchVehicles();
      fetchHistory();
      fetchServices();
      
      // Supabase Real-time tracking untuk notifikasi in-app
      const channel = supabase.channel('service-orders-customer')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'service_orders', filter: `customer_id=eq.${userId}` },
          (payload) => {
            const newStatus = payload.new.status;
            const oldStatus = payload.old.status;
            if (newStatus !== oldStatus) {
              showToast(`Status servis kendaraan Anda diperbarui menjadi "${newStatus.toUpperCase()}"`);
              fetchHistory();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, page]);

  const fetchVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
    if (data) setVehicles(data);
  };

  const fetchHistory = async () => {
    // Ambil order history beserta details order_items dan services
    const { data } = await supabase
      .from("service_orders")
      .select("*, vehicles(name, plate), order_items(name, qty, unit_price), services_catalog(name)")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false });
    if (data) setHistory(data);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("services_catalog").select("*").order("name", { ascending: true });
    if (data) setServices(data);
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.name || !newVehicle.plate) return alert("Nama dan Plat nomor wajib diisi!");
    setSubmittingV(true);
    const { error } = await supabase.from("vehicles").insert([{ ...newVehicle, owner_id: userId }]);
    setSubmittingV(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      showToast("Kendaraan berhasil ditambahkan!");
      setShowAddVehicle(false);
      setNewVehicle({ name: "", plate: "", type: "Motor", color: "#FF4757" });
      fetchVehicles();
    }
  };

  const handleBooking = async () => {
    if (!booking.vehicle_id || !booking.service_id || !booking.date || !booking.time || !booking.complaint) 
      return alert("Semua field wajib diisi!");
      
    setSubmittingB(true);
    const check_in_at = new Date(`${booking.date}T${booking.time}:00`).toISOString();
    
    // Siapkan payload, service_id mungkin error di Supabase kalau skema belum diupdate, 
    // akan di-fall-back ke complaint text kalau fail, tapi assumsinya skema sudah diupdate.
    const payload = {
      customer_id: userId,
      vehicle_id: booking.vehicle_id,
      service_id: booking.service_id,
      complaint: booking.complaint,
      status: "waiting",
      check_in_at
    };
    
    const { error } = await supabase.from("service_orders").insert([payload]);
    
    setSubmittingB(false);
    if (error) {
       alert("Pastikan script SQL update_schema.sql sudah dieksekusi di Supabase. Error: " + error.message);
    } else {
      showToast("Booking Servis Berhasil Dikirim!");
      setBooking({ vehicle_id: "", service_id: "", date: "", time: "", complaint: "" });
      setPage("history");
      fetchHistory();
    }
  };

  const handleUploadProof = async (orderId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(orderId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Math.random()}.${fileExt}`;
      const filePath = `transfers/${fileName}`;

      // Upload gambar ke storage
      const { error: uploadError } = await supabase.storage.from('payments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('payments').getPublicUrl(filePath);
      
      // Update DB order
      const { error: dbError } = await supabase.from('service_orders').update({
        payment_proof_url: urlData.publicUrl,
        status: 'waiting_payment_validation'
      }).eq('id', orderId);

      if (dbError) throw dbError;

      showToast("Bukti pembayaran berhasil diunggah!");
      fetchHistory();
    } catch (err) {
      alert("Gagal upload bukti bayar: Pastikan file sesuai & SQL RLS sudah dijalankan. Error: " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleRating = async (orderId, ratingVal, reviewTxt) => {
    const { error } = await supabase.from('service_orders').update({
      rating: ratingVal, review: reviewTxt
    }).eq('id', orderId);
    
    if (error) alert("Gagal kirim ulasan: " + error.message);
    else { showToast("Ulasan berhasil dikirim!"); fetchHistory(); }
  };

  const getSubtotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((acc, curr) => acc + (curr.unit_price * curr.qty), 0);
  };

  const activeOrders = history.filter(h => !["paid", "cancelled", "waiting_payment_validation"].includes(h.status));

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
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                       Layanan: {o.services_catalog?.name || "-"}<br/>
                       Keluhan: {o.complaint}
                    </div>
                    <Badge status={o.status} />
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Servis" value={history.length} icon="wrench" color={theme.primary} />
              <StatCard label="Kendaraan"    value={vehicles.length} icon="car"    color={theme.info} />
            </div>
          </div>
        );

      case "services":
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Daftar Layanan & Harga Acuan</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>Harga acuan estimasi. Harga akhir menyesuaikan kebutuhan sparepart.</div>
            {services.map(s => (
              <Card key={s.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                     <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                     <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{s.description}</div>
                     <div style={{ fontSize: 11, background: theme.bg, display: "inline-block", padding: "2px 8px", borderRadius: 4, marginTop: 6}}>⏱ {s.duration}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: theme.primary }}>Rp {s.price.toLocaleString()}</div>
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
              <div style={{ fontWeight: 700, marginBottom: 16 }}>2. Pilih Layanan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select value={booking.service_id} onChange={e => setBooking({...booking, service_id: e.target.value})} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, outline: "none", fontFamily: "'Sora', sans-serif" }}>
                  <option value="">-- Pilih Layanan Utama --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - Rp {s.price.toLocaleString()}</option>
                  ))}
                </select>
                {booking.service_id && (
                  <div style={{ padding: "10px 12px", background: theme.primary + "15", borderRadius: 8, fontSize: 13, color: theme.primary, fontWeight: 600 }}>
                    Estimasi Biaya Jasa: Rp {services.find(s => s.id === booking.service_id)?.price?.toLocaleString()}
                  </div>
                )}
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>3. Rencana Kedatangan</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" value={booking.date} onChange={e => setBooking({...booking, date: e.target.value})} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, outline: "none", fontFamily: "'Sora', sans-serif" }} min={new Date().toISOString().split('T')[0]} />
                <input type="time" value={booking.time} onChange={e => setBooking({...booking, time: e.target.value})} style={{ width: 120, padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, outline: "none", fontFamily: "'Sora', sans-serif" }} />
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>4. Detail Keluhan Tambahan</div>
              <textarea value={booking.complaint} onChange={e => setBooking({...booking, complaint: e.target.value})} placeholder="Contoh: Lampu riting kiri mati..." style={{ width: "100%", minHeight: 100, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Sora', sans-serif" }} />
            </Card>

            <Btn style={{ width: "100%", justifyContent: "center" }} size="lg" icon="check" onClick={handleBooking} disabled={submittingB || !booking.vehicle_id || !booking.service_id || !booking.date || !booking.time || !booking.complaint}>
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
               <EmptyState icon="car" title="Belum ada kendaraan" desc="Tambahkan kendaraan Anda untuk mulai booking" action="+ Tambah Kendaraan" onAction={() => setShowAddVehicle(true)} />
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
          <div className="print-area">
            {history.map((h) => (
              <Card key={h.id} style={{ marginBottom: 12, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{h.vehicles?.name}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{h.vehicles?.plate} · {formatDate(h.check_in_at)}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                       <strong>Layanan:</strong> {h.services_catalog?.name || "-"}<br/>
                       <strong>Keluhan:</strong> {h.complaint}
                    </div>
                  </div>
                  <Badge status={h.status} />
                </div>

                {/* Show Items & Total if mechanics inputted them */}
                {h.order_items && h.order_items.length > 0 && (
                   <div style={{ marginTop: 12, backgroundColor: "#f9fafb", padding: 12, borderRadius: 8 }}>
                       <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Rincian Tagihan</div>
                       {h.order_items.map((item, idx) => (
                           <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                              <div>{item.name} <span style={{ color: theme.textMuted }}>x{item.qty}</span></div>
                              <div style={{ fontWeight: 600 }}>Rp {(item.unit_price * item.qty).toLocaleString()}</div>
                           </div>
                       ))}
                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, marginTop: 8, borderTop: `1px dashed ${theme.border}`, paddingTop: 8 }}>
                          <div>Total Pembayaran</div>
                          <div style={{ color: theme.primary }}>Rp {getSubtotal(h.order_items).toLocaleString()}</div>
                       </div>
                   </div>
                )}

                {/* Status: done -> siap bayar */}
                {h.status === 'done' && (
                  <div style={{ borderTop: `1px dashed ${theme.border}`, paddingTop: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 12, marginBottom: 10, color: theme.danger, fontWeight: 600 }}>Tagihan menunggu pembayaran. Bisa tunai ke Kasir, atau Transfer & upload bukti di bawah.</div>
                    
                    <Btn size="sm" icon="upload" onClick={() => document.getElementById(`upload-${h.id}`).click()} disabled={uploadingId === h.id} style={{ width: "100%", justifyContent: "center" }}>
                      {uploadingId === h.id ? "Mengunggah..." : "Upload Bukti Transfer Bank"}
                    </Btn>
                    <input type="file" id={`upload-${h.id}`} style={{ display: "none" }} accept="image/*" onChange={(e) => handleUploadProof(h.id, e)} />
                  </div>
                )}

                {/* Status: waiting validation */}
                {h.status === 'waiting_payment_validation' && (
                   <div style={{ borderTop: `1px dashed ${theme.border}`, paddingTop: 12, marginTop: 12, fontSize: 12, color: theme.warning, fontWeight: 600 }}>
                     ⏳ Menunggu validasi bukti transfer oleh Kasir...
                   </div>
                )}

                {/* Status: paid -> invoice & rating */}
                {h.status === 'paid' && (
                  <div style={{ borderTop: `1px dashed ${theme.border}`, paddingTop: 12, marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <Btn size="sm" variant="outline" icon="print" onClick={() => window.print()} style={{ justifyContent: "center" }}>Cetak/Simpan Invoice</Btn>
                    
                    {!h.rating && (
                       <Btn size="sm" icon="star" style={{ background: theme.warning, color: "#fff", border: "none", justifyContent: "center" }} onClick={() => {
                          const rating = prompt("Rating kepuasan (1-5):", "5");
                          if (!rating) return;
                          const r = parseInt(rating);
                          if (r >= 1 && r <= 5) {
                             const rev = prompt("Ulasan & saran (opsional):");
                             handleRating(h.id, r, rev);
                          } else alert("Rating harus 1 hingga 5");
                       }}>Beri Ulasan Layanan</Btn>
                    )}
                    
                    {h.rating && (
                       <div style={{ fontSize: 13, color: theme.textMuted, background: "#f1f5f9", padding: "10px 12px", borderRadius: 8 }}>
                          <span style={{ fontSize: 15, letterSpacing: 2 }}>{"⭐".repeat(h.rating)}</span><br/>
                          {h.review && <span style={{ marginTop: 4, display: "block" }}>"{h.review}"</span>}
                       </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
            
            {/* CSS untuk print yang otomatis disisipkan -> Sembunyikan Nav saat Print */}
            <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
          </div>
        ) : <EmptyState icon="history" title="Belum ada riwayat servis" desc="Riwayat servis kendaraan Anda akan muncul di sini" />;

      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: theme.text, color: "#fff", padding: "12px 20px", borderRadius: 30, zIndex: 9999, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check" size={16} color="#fff" /> {toast}
        </div>
      )}
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
