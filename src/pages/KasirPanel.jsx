import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import { Sidebar, TopBar, MobileHeader, MobilePageTitle, MobileBottomNav } from "../components/layout";
import { Badge, Card, StatCard, Btn, Input, EmptyState } from "../components/ui";
import Icon from "../components/Icon";
import useIsMobile from "../hooks/useIsMobile";

const KasirPanel = ({ onLogout, userName }) => {
  const [page, setPage] = useState("antrian");
  const isMobile = useIsMobile();

  const navItems = [
    { id: "antrian", icon: "list",   label: "Antrian" },
    { id: "payment", icon: "dollar", label: "Bayar" },
    { id: "invoice", icon: "print",  label: "Invoice" },
  ];

  const [antrian, setAntrian] = useState([]);
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
    if (page === "antrian") fetchAntrian();
  }, [page]);

  const fetchAntrian = async () => {
    setLoading(true);
    // Fetch orders that are 'done' (ready to pay) or 'paid' (history)
    const { data } = await supabase
      .from("service_orders")
      .select("*, vehicles(name, plate), profiles!customer_id(full_name)")
      .in("status", ["done", "paid"])
      .order("created_at", { ascending: false });

    if (data) setAntrian(data);
    setLoading(false);
  };

  const handleMulaiBayar = async (orderId) => {
    setActiveOrderId(orderId);
    setPage("payment");
    setAmountPaid("");
    
    // Fetch order items to calculate total
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    if (items) {
      setOrderItems(items);
      const total = items.reduce((acc, curr) => acc + (curr.unit_price * curr.qty), 0);
      setSubtotal(total);
    }
  };

  const handleProsesBayar = async () => {
    const paid = parseInt(amountPaid);
    if (isNaN(paid) || paid < subtotal) {
      return alert("Jumlah uang yang dibayarkan kurang dari total tagihan!");
    }
    
    setSubmittingPayment(true);
    
    const change_amount = paid - subtotal;
    
    // 1. Insert to Invoices
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

    // 2. Update service order status
    await supabase.from("service_orders").update({ status: "paid" }).eq("id", activeOrderId);

    // 3. Deduct Inventory Stock (Simplified approach without RPC)
    const parts = orderItems.filter(i => i.item_type === "part");
    for (let p of parts) {
      // Fetch current stock
      const { data: currentInv } = await supabase.from("inventory").select("stock").eq("name", p.name).single();
      if (currentInv) {
         await supabase.from("inventory").update({ stock: currentInv.stock - p.qty }).eq("name", p.name);
      }
    }

    setSubmittingPayment(false);
    alert("Pembayaran berhasil!");
    
    // Switch to invoice view
    setActiveInvoice(invData);
    setPage("invoice");
    setActiveOrderId(null);
  };

  const activeOrderObj = antrian.find(a => a.id === activeOrderId);

  const renderPage = () => {
    switch (page) {
      case "antrian":
        if (loading) return <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>Memuat data antrian kasir...</div>;
        
        const waitingPayment = antrian.filter(a => a.status === "done");
        const alreadyPaid = antrian.filter(a => a.status === "paid");

        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <StatCard label="Belum Dibayar" value={waitingPayment.length} icon="dollar" color={theme.warning} />
              <StatCard label="Sudah Lunas" value={alreadyPaid.length} icon="check" color={theme.success} />
            </div>
            
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Menunggu Pembayaran</div>
            {waitingPayment.length === 0 ? (
               <EmptyState icon="check" title="Antrian Kosong" desc="Tidak ada order servis yang menunggu pembayaran saat ini." />
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
              {submittingPayment ? "Memproses Data..." : "Proses Pembayaran & Selesai"}
            </Btn>
          </div>
        );

      case "invoice":
        if (!activeInvoice) return <EmptyState icon="print" title="Belum Ada Transaksi" desc="Proses pembayaran terlebih dahulu untuk melihat invoice" />;

        return (
          <div>
            <Card style={{ marginBottom: 16, background: "#fff" }}>
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
              <Btn variant="outline" style={{ flex: 1, justifyContent: "center", color: theme.success, borderColor: theme.success }} icon="whatsapp">Kirim WA</Btn>
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
        { id: "antrian", icon: "list",   label: "Antrian Kasir", badge: antrian.filter(a => a.status === "done").length || null },
        { id: "payment", icon: "dollar", label: "Pembayaran" },
        { id: "invoice", icon: "print",  label: "Faktur Pembayaran" },
      ]} active={page} onSelect={setPage} role="kasir" userName={userName} onLogout={onLogout} />
      <div style={{ marginLeft: 240, flex: 1, padding: "28px 32px", background: theme.bg, minHeight: "100vh" }}>
        <TopBar title={[
          { id: "antrian", label: "Antrian Kasir" },
          { id: "payment", label: "Proses Pembayaran" },
          { id: "invoice", label: "Faktur Tagihan" },
        ].find(n => n.id === page)?.label} subtitle={new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} userName={userName} />
        {renderPage()}
      </div>
    </div>
  );
};

export default KasirPanel;
