import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Badge, Card, StatCard, Btn, EmptyState } from "../components/ui";
import Icon from "../components/Icon";
import useIsMobile from "../hooks/useIsMobile";

const KasirPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("antrian");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "antrian", icon: "list",     label: "Antrian" },
    { id: "payment", icon: "dollar",   label: "Bayar" },
    { id: "invoice", icon: "print",    label: "Invoice" },
    { id: "reports", icon: "document", label: "Laporan" }, // FITUR BARU
  ];

  const [antrian, setAntrian] = useState([]);
  const [invoices, setInvoices] = useState([]); // FOR REPORTS
  const [loading, setLoading] = useState(true);

  // Payment State
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [amountPaid, setAmountPaid] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Invoice State
  const [activeInvoice, setActiveInvoice] = useState(null);

  useEffect(() => {
    if (page === "antrian" || page === "reports") fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    
    if (page === "antrian") {
        const { data } = await supabase
          .from("service_orders")
          .select("*, vehicles(name, plate), profiles!customer_id(full_name)")
          .in("status", ["done", "waiting_payment_validation", "paid"])
          .order("created_at", { ascending: false });
        if (data) setAntrian(data);
    } else if (page === "reports") {
        // Fetch only today's invoices
        const todayStr = new Date();
        todayStr.setHours(0,0,0,0);
        const { data } = await supabase
          .from("invoices")
          .select("*, service_orders(vehicles(plate), profiles!customer_id(full_name))")
          .gte("paid_at", todayStr.toISOString())
          .order("paid_at", { ascending: false });
        if (data) setInvoices(data);
    }

    setLoading(false);
  };

  const handleMulaiBayar = async (orderId) => {
    setActiveOrderId(orderId);
    setPage("payment");
    
    const orderObj = antrian.find(a => a.id === orderId);
    if (orderObj?.status === 'waiting_payment_validation') {
       setPaymentMethod("Transfer");
    } else {
       setPaymentMethod("Tunai");
       setAmountPaid("");
    }
    
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    if (items) {
      setOrderItems(items);
      const total = items.reduce((acc, curr) => acc + (curr.unit_price * curr.qty), 0);
      setSubtotal(total);
      
      if (orderObj?.status === 'waiting_payment_validation') {
         setAmountPaid(total.toString());
      }
    }
  };

  const handleProsesBayar = async () => {
    const paid = parseInt(amountPaid);
    if (isNaN(paid) || paid < subtotal) {
      return alert("Jumlah uang yang dibayarkan kurang dari total tagihan!");
    }
    
    setSubmittingPayment(true);
    const change_amount = paid - subtotal;
    
    const { data: invData, error: invError } = await supabase.from("invoices").insert([{
      order_id: activeOrderId,
      subtotal,
      total: subtotal,
      payment_method: paymentMethod,
      amount_paid: paid,
      change_amount,
      paid_at: new Date().toISOString()
    }]).select().single();

    if (invError) {
      setSubmittingPayment(false);
      return alert("Gagal membuat invoice: " + invError.message);
    }

    await supabase.from("service_orders").update({ status: "paid" }).eq("id", activeOrderId);

    // Simple Inventory Deduct
    const parts = orderItems.filter(i => i.item_type === "part");
    for (let p of parts) {
      const { data: currentInv } = await supabase.from("inventory").select("stock").eq("name", p.name).single();
      if (currentInv) {
         await supabase.from("inventory").update({ stock: currentInv.stock - p.qty }).eq("name", p.name);
      }
    }

    setSubmittingPayment(false);
    alert("Pembayaran berhasil divalidasi!");
    
    setActiveInvoice(invData);
    setPage("invoice");
    setActiveOrderId(null);
  };

  // EXPORT CSV JS SYSTEM
  const handleExportCSV = () => {
     if (invoices.length === 0) return alert("Peringatan: Tidak ada data transaksi yang dapat di-ekspor hari ini.");

     const headers = ["No. Invoice", "Waktu Pembayaran", "Nama Pelanggan", "Plat Nomor", "Metode", "Subtotal (Rp)", "Potongan", "Total Tagihan (Rp)"];
     
     const rows = invoices.map(i => {
         const wkt = i.paid_at ? new Date(i.paid_at).toLocaleString('id-ID') : "-";
         const cus = i.service_orders?.profiles?.full_name || "-";
         const pl = i.service_orders?.vehicles?.plate || "-";
         
         return [
             i.invoice_number,
             `"${wkt}"`, 
             `"${cus}"`,
             `"${pl}"`,
             i.payment_method,
             i.subtotal,
             i.discount || 0,
             i.total
         ].join(",");
     });

     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `Rekap_Bengkel_${new Date().toISOString().split('T')[0]}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const activeOrderObj = antrian.find(a => a.id === activeOrderId);

  const renderPage = () => {
    switch (page) {
      case "antrian":
        if (loading) return <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>Memuat data antrian kasir...</div>;
        
        const waitingPayment = antrian.filter(a => a.status === "done");
        const waitingValidation = antrian.filter(a => a.status === "waiting_payment_validation");
        const alreadyPaid = antrian.filter(a => a.status === "paid");

        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <StatCard label="Belum Dibayar" value={waitingPayment.length} icon="dollar" color={theme.warning} />
              <StatCard label="Perlu Validasi" value={waitingValidation.length} icon="check" color={theme.info} />
            </div>
            
            {waitingValidation.length > 0 && (
               <>
                 <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: theme.info }}>Menunggu Validasi Transfer</div>
                 {waitingValidation.map((a) => (
                   <Card key={a.id} style={{ marginBottom: 10, border: `1px solid ${theme.info}50` }}>
                     <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                       <div style={{ width: 40, height: 40, background: theme.info + "15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                         <Icon name="image" size={20} color={theme.info} />
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ fontWeight: 800, fontSize: 14 }}>{a.vehicles?.name} ({a.vehicles?.plate})</div>
                         <div style={{ fontSize: 12, color: theme.textMuted }}>{a.profiles?.full_name}</div>
                       </div>
                       <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                         <Badge status={a.status} />
                         <Btn size="sm" icon="check" onClick={() => handleMulaiBayar(a.id)}>Validasi</Btn>
                       </div>
                     </div>
                   </Card>
                 ))}
               </>
            )}

            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, marginTop: waitingValidation.length ? 24 : 0 }}>Pembayaran Tunai (Menunggu)</div>
            {waitingPayment.length === 0 ? (
               <EmptyState icon="check" title="Antrian Kosong" desc="Tidak ada order servis yang menunggu pembayaran tunai saat ini." />
            ) : waitingPayment.map((a) => (
              <Card key={a.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, background: theme.warning + "15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: theme.warning, fontSize: 18, flexShrink: 0 }}>
                    <Icon name="dollar" size={20} color={theme.warning} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{a.vehicles?.name} ({a.vehicles?.plate})</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{a.profiles?.full_name}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                    <Badge status={a.status} />
                    <Btn size="sm" icon="dollar" onClick={() => handleMulaiBayar(a.id)}>Bayar</Btn>
                  </div>
                </div>
              </Card>
            ))}

            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, marginTop: 24 }}>Riwayat Lunas Terbaru</div>
            {alreadyPaid.slice(0, 5).map((a) => (
              <Card key={a.id} style={{ marginBottom: 10, opacity: 0.8 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.vehicles?.name} ({a.vehicles?.plate})</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{a.profiles?.full_name} · Lunas</div>
                  </div>
                  <Badge status={a.status} />
                </div>
              </Card>
            ))}
          </div>
        );

      case "payment":
        if (!activeOrderId) return <EmptyState icon="dollar" title="Belum Ada Transaksi" desc="Pilih order yang sudah selesai di halaman Antrian terlebih dahulu." action="Kembali ke Antrian" onAction={() => setPage("antrian")} />;

        return (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>Detail Pembayaran</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13 }}>Pelanggan: <span style={{ fontWeight: 700 }}>{activeOrderObj?.profiles?.full_name}</span></div>
                <div style={{ fontSize: 13 }}>Kendaraan: <span style={{ fontWeight: 700 }}>{activeOrderObj?.vehicles?.name} ({activeOrderObj?.vehicles?.plate})</span></div>
              </div>
              
              <div style={{ borderTop: `1px dashed ${theme.border}`, paddingTop: 12, marginBottom: 12 }}>
                {orderItems.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                    <div>
                      <div>{item.name}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{item.qty}x</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>Rp {(item.unit_price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>TOTAL TAGIHAN</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: theme.primary }}>Rp {subtotal.toLocaleString()}</div>
              </div>

              {activeOrderObj?.payment_proof_url && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px dashed ${theme.border}` }}>
                   <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: theme.info }}>📸 Bukti Transfer Pelanggan:</div>
                   <a href={activeOrderObj.payment_proof_url} target="_blank" rel="noreferrer">
                     <img src={activeOrderObj.payment_proof_url} alt="Bukti" style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8, border: `1px solid ${theme.border}` }} />
                   </a>
                   <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, textAlign: "center" }}>Klik gambar untuk memperbesar</div>
                </div>
              )}
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Metode Pembayaran</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {["Tunai", "Transfer", "QRIS", "EDC"].map((m) => (
                  <div 
                    key={m} 
                    onClick={() => setPaymentMethod(m)}
                    style={{ padding: "12px", border: `2px solid ${paymentMethod === m ? theme.primary : theme.border}`, borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: paymentMethod === m ? 700 : 500, color: paymentMethod === m ? theme.primary : theme.text, background: paymentMethod === m ? `${theme.primary}10` : "#fff" }}>
                    {m}
                  </div>
                ))}
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Jumlah Uang Diterima (Rp)</div>
                <input 
                  type="number" 
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`Min. Rp ${subtotal.toLocaleString()}`} 
                  style={{ width: "100%", padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 10, border: `1.5px solid ${theme.border}`, outline: "none", boxSizing: "border-box", fontFamily: "'Sora', sans-serif" }} 
                />
              </div>

              {parseInt(amountPaid) >= subtotal && (
                <div style={{ background: theme.success + "15", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: theme.success, fontWeight: 700, fontSize: 13 }}>Kembalian:</div>
                  <div style={{ color: theme.success, fontWeight: 800, fontSize: 15 }}>Rp {(parseInt(amountPaid) - subtotal).toLocaleString()}</div>
                </div>
              )}
            </Card>

            <Btn size="lg" style={{ width: "100%", justifyContent: "center", fontSize: 16 }} icon="check" onClick={handleProsesBayar} disabled={submittingPayment || parseInt(amountPaid) < subtotal || isNaN(parseInt(amountPaid))}>
              {submittingPayment ? "Memproses Data..." : (activeOrderObj?.status === 'waiting_payment_validation' ? "Validasi Transfer & Lunas" : "Proses Pembayaran & Selesai")}
            </Btn>
          </div>
        );

      case "invoice":
        if (!activeInvoice) return <EmptyState icon="print" title="Belum Ada Transaksi" desc="Proses pembayaran terlebih dahulu untuk melihat invoice" />;

        return (
          <div className="print-area">
            <Card style={{ marginBottom: 16, background: "#fff", position: "relative" }}>
              <div style={{ borderBottom: `2px dashed ${theme.border}`, paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: theme.primary }}>BengkelPro</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>Jl. Bengkel Raya No. 12, Bandung</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 1 }}>INVOICE</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{activeInvoice.invoice_number}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{new Date(activeInvoice.paid_at).toLocaleDateString("id-ID")}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13 }}>Telah Terima Dari: <span style={{ fontWeight: 700 }}>Pelanggan</span></div>
                <div style={{ fontSize: 13 }}>Metode: <span style={{ fontWeight: 700 }}>{activeInvoice.payment_method}</span></div>
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Subtotal</div>
                  <div>Rp {activeInvoice.subtotal.toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 800 }}>TOTAL BAYAR</div>
                  <div style={{ fontWeight: 800, color: theme.primary }}>Rp {activeInvoice.total.toLocaleString()}</div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
                  <div>Uang Diterima</div>
                  <div>Rp {activeInvoice.amount_paid.toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.textMuted }}>
                  <div>Kembalian</div>
                  <div>Rp {activeInvoice.change_amount.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: theme.textMuted, marginTop: 24 }}>
                Terima kasih atas kunjungan Anda.<br/>Layanan berkualitas, kendaraan puas!
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1, justifyContent: "center" }} icon="home" onClick={() => { setActiveInvoice(null); setPage("antrian")}}>Selesai</Btn>
              <Btn variant="outline" style={{ flex: 1, justifyContent: "center" }} icon="print" onClick={() => window.print()}>Cetak</Btn>
            </div>
            <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
          </div>
        );

      case "reports":
        if (loading) return <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>Memuat Data Keuangan...</div>;

        const totalPendapatan = invoices.reduce((acc, curr) => acc + curr.total, 0);

        return (
           <div>
             <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Btn icon="document" onClick={handleExportCSV}>Export CSV</Btn>
             </div>
             
             <Card style={{ marginBottom: 16, background: theme.primary, color: "#fff" }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Total Pendapatan (Hari Ini)</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>Rp {totalPendapatan.toLocaleString()}</div>
             </Card>

             <Card style={{ padding: 0, overflow: "hidden" }}>
                 <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12, padding: "12px 16px", background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                   <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Info Order</div>
                   <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Jam Lunas</div>
                   <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>Nominal</div>
                 </div>
                 {invoices.length === 0 ? (
                    <EmptyState icon="document" title="Belum Ada Transaksi" desc="Belum ada tagihan lunas pada hari ini." />
                 ) : invoices.map(inv => (
                    <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                       <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{inv.invoice_number}</div>
                          <div style={{ fontSize: 11, color: theme.textMuted }}>{inv.service_orders?.profiles?.full_name} ({inv.service_orders?.vehicles?.plate})</div>
                       </div>
                       <div style={{ fontSize: 12 }}>{new Date(inv.paid_at).toLocaleTimeString("id-ID")}</div>
                       <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: theme.primary }}>Rp {inv.total.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{inv.payment_method}</div>
                       </div>
                    </div>
                 ))}
             </Card>
           </div>
        );

      default: return null;
    }
  };

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: theme.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <MobileHeader title="BengkelPro Kasir" onLogout={onLogout} />
        <div style={{ padding: "16px 16px" }}>
          <MobilePageTitle
            title={navItems.find(n => n.id === page)?.label === "Antrian" ? "Antrian Kasir" : navItems.find(n => n.id === page)?.label}
            subtitle={new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
        { id: "antrian", icon: "list",     label: "Antrian Kasir", badge: antrian.filter(a => a.status === "done" || a.status === "waiting_payment_validation").length || null },
        { id: "payment", icon: "dollar",   label: "Pembayaran" },
        { id: "invoice", icon: "print",    label: "Faktur Pembayaran" },
        { id: "reports", icon: "document", label: "Laporan Harian" },
      ]} active={page} onSelect={setPage} role="kasir" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={[
          { id: "antrian", label: "Antrian Kasir" },
          { id: "payment", label: "Proses Pembayaran" },
          { id: "invoice", label: "Faktur Tagihan" },
          { id: "reports", label: "Rekap Transaksi Keuangan Harian" },
        ].find(n => n.id === page)?.label} subtitle={new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default KasirPanel;
