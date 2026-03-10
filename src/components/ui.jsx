import { theme, STATUS } from "../constants/theme";
import Icon from "./Icon";

// ─── BADGE ───────────────────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.waiting;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>
      {s.label}
    </span>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${theme.border}`, padding: 20, ...style }}>{children}</div>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, color, trend }) => (
  <Card>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: theme.text, fontFamily: "'Sora', sans-serif" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: trend === "up" ? theme.success : theme.danger, marginTop: 4, fontWeight: 600 }}>{trend === "up" ? "▲" : "▼"} {sub}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color={color} />
      </div>
    </div>
  </Card>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, desc, action }) => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <div style={{ width: 72, height: 72, background: theme.bg, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
      <Icon name={icon} size={30} color={theme.textMuted} />
    </div>
    <div style={{ fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 6, fontFamily: "'Sora', sans-serif" }}>{title}</div>
    <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>{desc}</div>
    {action && <button style={{ background: theme.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>{action}</button>}
  </div>
);

// ─── BTN ──────────────────────────────────────────────────────────────────────
export const Btn = ({ children, variant = "primary", size = "md", icon, onClick, style = {} }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 7, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontFamily: "'Sora', sans-serif", transition: "all 0.15s" };
  const variants = {
    primary: { background: theme.primary, color: "#fff" },
    outline:  { background: "#fff", color: theme.primary, border: `1.5px solid ${theme.primary}` },
    ghost:    { background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` },
    danger:   { background: theme.danger, color: "#fff" },
    success:  { background: theme.success, color: "#fff" },
  };
  const sizes = {
    sm: { padding: "7px 14px", fontSize: 12 },
    md: { padding: "10px 18px", fontSize: 13 },
    lg: { padding: "13px 26px", fontSize: 15 },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...sizes[size], ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 15} color={variants[variant].color} />}
      {children}
    </button>
  );
};

// ─── INPUT ────────────────────────────────────────────────────────────────────
export const Input = ({ label, placeholder, type = "text", value, onChange }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 6, fontFamily: "'Sora', sans-serif" }}>{label}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${theme.border}`, borderRadius: 10, fontSize: 13.5, color: theme.text, outline: "none", background: "#fff", fontFamily: "'Sora', sans-serif", boxSizing: "border-box" }} />
  </div>
);
