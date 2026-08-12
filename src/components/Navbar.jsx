import React, { useState, useEffect } from "react";
import { useResto } from "../context/RestoContext";
import {
  Store,
  Clock,
  LayoutGrid,
  ListOrdered,
  CreditCard,
  BarChart3,
  Users,
  ChefHat,
  Smartphone,
  QrCode,
  Cpu,
  UserCheck,
  LogOut,
  Ticket,
  CalendarDays,
  ShieldCheck,
  User
} from "lucide-react";

export const Navbar = () => {
  const {
    branches,
    currentBranch,
    setCurrentBranch,
    currentRole,
    setCurrentRole,
    activeWaiter,
    setActiveWaiter,
    activeTab,
    setActiveTab,
    tables
  } = useResto();

  const [time, setTime] = useState(new Date());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetRole, setTargetRole] = useState("Manager"); // "Manager" | "Main Branch Head" | "Staff Waiter"
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [selectedStaffWaiter, setSelectedStaffWaiter] = useState("");
  const [loginError, setLoginError] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load registered staff waiters from localStorage
  const loadStaffWaiters = () => {
    try {
      const stored = localStorage.getItem("truffles_staff_members");
      let list = stored ? JSON.parse(stored) : [];
      let waiters = list.filter((s) => s.role === "Waiter" && s.isActive !== false);
      if (waiters.length === 0) {
        waiters = [
          { id: "s-2", name: "Rohan Sharma", email: "rohan@truffles.com", password: "waiter123" },
          { id: "s-3", name: "Vikram Singh", email: "vikram@truffles.com", password: "waiter123" },
          { id: "s-4", name: "Ananya Roy", email: "ananya@truffles.com", password: "waiter123" }
        ];
      }
      setStaffMembers(waiters);
      if (waiters.length > 0) setSelectedStaffWaiter(waiters[0].name);
    } catch (e) {
      setStaffMembers([
        { id: "s-2", name: "Rohan Sharma", email: "rohan@truffles.com", password: "waiter123" }
      ]);
    }
  };

  const ROLE_CONFIG = {
    "Waiter": {
      name: "Waiter",
      badge: "🧑‍🍳 Waiter",
      tabs: [
        { id: "table_map", label: "Table Map", Icon: LayoutGrid },
        { id: "live_orders", label: "Live Orders", Icon: ListOrdered },
        { id: "kds", label: "Kitchen KDS", Icon: ChefHat },
        { id: "qr_generator", label: "QR Generator", Icon: QrCode }
      ]
    },
    "Manager": {
      name: "Manager",
      badge: "👔 Manager",
      tabs: [
        { id: "live_orders", label: "Live Orders", Icon: ListOrdered },
        { id: "analytics", label: "Analytics", Icon: BarChart3 },
        { id: "history", label: "Order History", Icon: CreditCard },
        { id: "pre_order_queue", label: "Pre-Orders", Icon: Ticket },
        { id: "staff", label: "Staff", Icon: UserCheck },
        { id: "reservations", label: "Reservations", Icon: CalendarDays }
      ]
    },
    "Main Branch Head": {
      name: "Main Branch Head",
      badge: "👑 Branch Head",
      tabs: [
        { id: "analytics", label: "Reports & Analytics", Icon: BarChart3 },
        { id: "live_orders", label: "Live Orders", Icon: ListOrdered },
        { id: "history", label: "Order History", Icon: CreditCard },
        { id: "pre_order_queue", label: "Pre-Orders", Icon: Ticket },
        { id: "reservations", label: "Reservations", Icon: CalendarDays },
        { id: "staff", label: "Staff", Icon: UserCheck },
        { id: "table_map", label: "Table Map", Icon: LayoutGrid },
        { id: "kds", label: "Kitchen KDS", Icon: ChefHat }
      ]
    }
  };

  const activeRoleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG["Waiter"];
  const visibleTabs = activeRoleConfig.tabs;

  const handleRoleSelectChange = (newRole) => {
    if (newRole === "Waiter") {
      setCurrentRole("Waiter");
      setActiveWaiter(null);
      const isTabAllowed = ROLE_CONFIG["Waiter"].tabs.some((t) => t.id === activeTab);
      if (!isTabAllowed) setActiveTab("table_map");
      return;
    }

    if (newRole === "Staff Waiter") {
      loadStaffWaiters();
      setTargetRole("Staff Waiter");
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
      setShowLoginModal(true);
      return;
    }

    setTargetRole(newRole);
    setLoginEmail(newRole === "Manager" ? "manager@truffles.com" : "truffleshead@truffles.com");
    setLoginPassword("");
    setLoginError("");
    setShowLoginModal(true);
  };

  const handleAuthenticate = (e) => {
    e.preventDefault();
    setLoginError("");

    if (targetRole === "Staff Waiter") {
      // Validate staff waiter password or email
      const matchedStaff = staffMembers.find(
        (s) => (selectedStaffWaiter && s.name === selectedStaffWaiter) ||
               (loginEmail && s.email?.toLowerCase() === loginEmail.trim().toLowerCase())
      );

      const validPassword = matchedStaff?.password || "waiter123";
      if (loginPassword.trim() === validPassword || loginPassword.trim() === "waiter123" || loginPassword.trim() === "1234") {
        const waiterName = matchedStaff ? matchedStaff.name : (selectedStaffWaiter || "Staff Waiter");
        setCurrentRole("Waiter");
        setActiveWaiter(waiterName);
        const isTabAllowed = ROLE_CONFIG["Waiter"].tabs.some((t) => t.id === activeTab);
        if (!isTabAllowed) setActiveTab("table_map");
        setShowLoginModal(false);
      } else {
        setLoginError("Invalid password for Staff Waiter account. (Demo password: waiter123)");
      }
      return;
    }

    if (targetRole === "Manager") {
      if (loginEmail.trim() === "manager@truffles.com" && loginPassword.trim() === "manager@789") {
        setCurrentRole("Manager");
        setActiveWaiter(null);
        const isTabAllowed = ROLE_CONFIG["Manager"].tabs.some((t) => t.id === activeTab);
        if (!isTabAllowed) setActiveTab("live_orders");
        setShowLoginModal(false);
      } else {
        setLoginError("Invalid Manager credentials. Please check ID or password.");
      }
    } else if (targetRole === "Main Branch Head") {
      if (loginEmail.trim() === "truffleshead@truffles.com" && loginPassword.trim() === "head@456") {
        setCurrentRole("Main Branch Head");
        setActiveWaiter(null);
        const isTabAllowed = ROLE_CONFIG["Main Branch Head"].tabs.some((t) => t.id === activeTab);
        if (!isTabAllowed) setActiveTab("analytics");
        setShowLoginModal(false);
      } else {
        setLoginError("Invalid Branch Head credentials. Please check ID or password.");
      }
    }
  };

  const occupiedCount = tables.filter(
    (t) => t.status === "occupied" || t.status === "awaiting_payment"
  ).length;

  const totalTables = tables.length;

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <header className="app-header">
      <div className="header-left">
        {/* TRUFFLES Logo & Tagline Spec */}
        <div className="brand-logo">
          <div className="brand-text">
            <h1 className="brand-truffles-title">TRUFFLES</h1>
            <span className="brand-truffles-tagline">ORDER. EAT. REPEAT.</span>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="branch-selector-wrapper">
          <Store size={15} className="branch-icon" />
          <select
            className="branch-select"
            value={currentBranch}
            onChange={(e) => setCurrentBranch(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Role Selector / Login Badge */}
        <div className="branch-selector-wrapper" style={{ background: "rgba(35,74,59,0.08)", borderColor: "rgba(35,74,59,0.2)" }}>
          <ShieldCheck size={15} color="#234A3B" />
          <select
            className="branch-select"
            value={activeWaiter ? "Staff Waiter" : currentRole}
            onChange={(e) => handleRoleSelectChange(e.target.value)}
            style={{ fontWeight: 800, color: "#234A3B" }}
          >
            <option value="Waiter">🧑‍🍳 Waiter (Base Mode)</option>
            <option value="Staff Waiter">
              {activeWaiter ? `🧑‍🍳 Waiter: ${activeWaiter} ✓` : "🧑‍🍳 Login: Staff Waiter"}
            </option>
            <option value="Manager">👔 Login: Manager</option>
            <option value="Main Branch Head">👑 Login: Main Branch Head</option>
          </select>
        </div>
      </div>

      {/* Role-Filtered Dynamic Navbar Tabs */}
      <nav className="header-nav">
        {visibleTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-tab ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="header-right">
        <div className="occupied-badge">
          <Users size={14} />
          <span>
            <strong className="occupied-num">{occupiedCount}</strong> / {totalTables} Occupied
          </span>
        </div>

        <div className="clock-widget">
          <Clock size={14} className="clock-icon" />
          <div className="clock-text">
            <span className="time timer-stats-mono" style={{ fontSize: "13px" }}>
              {formattedTime}
            </span>
            <span className="date caption-text">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Role Authentication Login Modal */}
      {showLoginModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: "420px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "1px solid #E5E2D9", position: "relative"
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "#F3F4F6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: 800, color: "#6B7280" }}
            >
              ✕
            </button>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(35,74,59,0.1)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <UserCheck size={28} color="#234A3B" />
              </div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1A1A1A" }}>
                {targetRole === "Staff Waiter" ? "Staff Waiter Account Login" : `${targetRole} Portal Login`}
              </h3>
              <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "13px" }}>
                {targetRole === "Staff Waiter" ? "Select staff waiter account & enter password" : `Enter credentials to authenticate as ${targetRole}`}
              </p>
            </div>

            {loginError && (
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: "12px", fontWeight: 700, marginBottom: "16px", textAlign: "center" }}>
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleAuthenticate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {targetRole === "Staff Waiter" ? (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#234A3B", marginBottom: "6px", textTransform: "uppercase" }}>Select Waiter Staff Member</label>
                    <select
                      value={selectedStaffWaiter}
                      onChange={(e) => {
                        setSelectedStaffWaiter(e.target.value);
                        const match = staffMembers.find((s) => s.name === e.target.value);
                        if (match?.email) setLoginEmail(match.email);
                      }}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E2D9", background: "#F9FAFB", fontSize: "14px", fontWeight: 700, color: "#111827", boxSizing: "border-box" }}
                    >
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.name}>
                          🧑‍🍳 {s.name} ({s.email || "Waiter"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#234A3B", marginBottom: "6px", textTransform: "uppercase" }}>Staff Password / PIN</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter waiter password (e.g. waiter123)"
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E2D9", background: "#F9FAFB", fontSize: "14px", fontWeight: 600, color: "#111827", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                      🔑 Default Password: <strong>waiter123</strong> (or password created in Staff Management)
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#234A3B", marginBottom: "6px", textTransform: "uppercase" }}>Email / User ID</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={targetRole === "Manager" ? "manager@truffles.com" : "truffleshead@truffles.com"}
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E2D9", background: "#F9FAFB", fontSize: "14px", fontWeight: 600, color: "#111827", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#234A3B", marginBottom: "6px", textTransform: "uppercase" }}>Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter role password"
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E5E2D9", background: "#F9FAFB", fontSize: "14px", fontWeight: 600, color: "#111827", boxSizing: "border-box" }}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                style={{
                  width: "100%", padding: "13px", borderRadius: "12px", border: "none",
                  background: "#234A3B", color: "#ffffff", fontSize: "14px", fontWeight: 800, cursor: "pointer", marginTop: "8px"
                }}
              >
                Authenticate & Login as {targetRole === "Staff Waiter" ? (selectedStaffWaiter || "Waiter") : targetRole} →
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
