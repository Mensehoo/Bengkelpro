import { useState, useEffect } from "react";
import { theme } from "../constants/theme";
import Icon from "./Icon";

// ─── REALTIME CLOCK HOOK ──────────────────────────────────────────────────────
const useRealtimeClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  return {
    day:  DAYS[now.getDay()],
    date: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
};

// ─── SIDEBAR (Desktop) ───────────────────────────────────────────────────────
export const Sidebar = ({ items, active, onSelect, role, userName, onLogout }) => {
  const roleColors = { admin: "#1A1A2E", owner: "#0F3460", mekanik: "#16213E", kasir: "#1B1B2F", customer: "#1A1A2E" };
  const bg = roleColors[role] || "#1A1A2E";
  const { day, date, time } = useRealtimeClock();

  return (
    <div style={{ width: 240, minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, background: theme.primary, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="wrench" size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>BengkelPro</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{role}</div>
          </div>
        </div>
        {/* Realtime Clock di Sidebar */}
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 12px" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "'Sora', sans-serif" }}>{day}, {date}</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, fontFamily: "'Sora', sans-serif", letterSpacing: 1 }}>{time}</div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {items.map((item) => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 4, background: active === item.id ? `${theme.primary}22` : "transparent", color: active === item.id ? theme.primary : "rgba(255,255,255,0.55)", fontWeight: active === item.id ? 700 : 500, fontSize: 13.5, fontFamily: "'Sora', sans-serif", transition: "all 0.15s", textAlign: "left" }}>
            <Icon name={item.icon} size={17} color={active === item.id ? theme.primary : "rgba(255,255,255,0.45)"} />
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", background: theme.primary, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {userName && (
          <div style={{ padding: "8px 12px", marginBottom: 8, borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'Sora', sans-serif" }}>Login sebagai</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
          </div>
        )}
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: "none", background: "rgba(255,71,87,0.12)", color: "#FF4757", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Sora', sans-serif" }}>
          <Icon name="logout" size={16} color="#FF4757" /> Keluar
        </button>
      </div>
    </div>
  );
};

// ─── TOP BAR (Desktop) ───────────────────────────────────────────────────────
export const TopBar = ({ title, subtitle, userName }) => {
  const { day, date, time } = useRealtimeClock();
  const initials = userName ? userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, fontFamily: "'Sora', sans-serif" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Realtime Clock di TopBar */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: "'Sora', sans-serif" }}>{day}, {date}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, fontFamily: "'Sora', sans-serif", letterSpacing: 0.5 }}>{time}</div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${theme.border}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
          <Icon name="bell" size={18} color={theme.textMuted} />
          <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, background: theme.primary, borderRadius: "50%", border: "2px solid #fff" }} />
        </button>
        <div title={userName} style={{ width: 40, height: 40, borderRadius: 12, background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14, fontFamily: "'Sora', sans-serif", cursor: "default" }}>{initials}</div>
      </div>
    </div>
  );
};

// ─── MOBILE HEADER ───────────────────────────────────────────────────────────
export const MobileHeader = ({ title, onLogout }) => {
  const { day, date, time } = useRealtimeClock();
  return (
    <div style={{ background: "#fff", borderBottom: `1px solid ${theme.border}`, padding: "10px 16px", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: theme.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="wrench" size={15} color="#fff" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: theme.text, fontFamily: "'Sora', sans-serif" }}>BengkelPro</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,71,87,0.1)", border: "none", borderRadius: 8, color: "#FF4757", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "'Sora', sans-serif", padding: "6px 10px" }}>
            <Icon name="logout" size={13} color="#FF4757" /> Keluar
          </button>
        </div>
      </div>
      {/* Realtime Clock di Mobile Header */}
      <div style={{ marginTop: 6, fontSize: 11, color: theme.textMuted, fontFamily: "'Sora', sans-serif" }}>
        🕐 {day}, {date} — <span style={{ fontWeight: 700, color: theme.text }}>{time}</span>
      </div>
    </div>
  );
};

// ─── MOBILE PAGE TITLE ────────────────────────────────────────────────────────
export const MobilePageTitle = ({ title, subtitle }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontWeight: 800, fontSize: 18, color: theme.text, fontFamily: "'Sora', sans-serif" }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{subtitle}</div>}
  </div>
);

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
export const MobileBottomNav = ({ items, active, onSelect }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${theme.border}`, display: "flex", padding: "8px 0 12px", zIndex: 50 }}>
    {items.map((item) => (
      <button key={item.id} onClick={() => onSelect(item.id)} style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", position: "relative" }}>
        <Icon name={item.icon} size={22} color={active === item.id ? theme.primary : theme.textMuted} />
        {item.badge && (
          <span style={{ position: "absolute", top: 0, right: "50%", transform: "translateX(10px)", background: theme.primary, color: "#fff", borderRadius: 20, padding: "0 5px", fontSize: 9, fontWeight: 800, lineHeight: "14px" }}>{item.badge}</span>
        )}
        <span style={{ fontSize: 10, color: active === item.id ? theme.primary : theme.textMuted, fontWeight: active === item.id ? 700 : 500, fontFamily: "'Sora', sans-serif" }}>{item.label}</span>
      </button>
    ))}
  </div>
);
