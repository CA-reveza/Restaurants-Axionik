import React, { useState, useEffect, useCallback } from "react";
import { supabase, fetchReservations, createReservation, cancelReservation } from "../../lib/supabase";
import { useResto } from "../../context/RestoContext";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  User,
  Phone,
  Table as TableIcon,
  X
} from "lucide-react";

export const ReservationsDashboard = () => {
  const { tables, updateTableStatus } = useResto();
  const [activeTab, setActiveTab] = useState("active"); // "active" or "history"
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const initialLoadDone = React.useRef(false);

  // Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [resDate, setResDate] = useState(new Date().toISOString().split("T")[0]);
  const [resTime, setResTime] = useState("19:00");
  const [guestCount, setGuestCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const vacantTables = tables.filter((t) => t.status === "vacant");

  const loadAllReservations = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);

    let dbRes = [];
    try {
      const { data } = await supabase
        .from("reservations")
        .select("*, restaurant_tables(table_number)")
        .order("start_time", { ascending: true });
      if (data) dbRes = data;
    } catch (e) {}

    let localRes = [];
    try {
      const raw = localStorage.getItem("truffles_reservations");
      if (raw) localRes = JSON.parse(raw);
    } catch (e) {}

    const merged = [...dbRes];
    localRes.forEach((lr) => {
      if (!merged.some((m) => m.id === lr.id)) {
        merged.push(lr);
      }
    });

    setReservations(merged);
    setLoading(false);
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    loadAllReservations();
    const channel = supabase
      .channel("reservations_admin_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => loadAllReservations())
      .subscribe();

    const handleStorage = (e) => {
      if (e.key === "truffles_reservations" || e.key === "truffles_last_event") {
        loadAllReservations();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadAllReservations]);

  const getTableLabel = (res) => {
    if (res.restaurant_tables?.table_number) return `T${res.restaurant_tables.table_number}`;
    if (res.table_number) return `T${res.table_number}`;
    if (res.table_id) {
      const match = tables.find((t) => t.id === res.table_id);
      if (match) return `T${match.number || match.table_number}`;
      if (typeof res.table_id === "number" || !isNaN(res.table_id)) return `T${res.table_id}`;
    }
    return "Assigned Table";
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();
    if (!custName || !selectedTableId) return;
    setSubmitting(true);

    const startTimeISO = new Date(`${resDate}T${resTime}:00`).toISOString();

    const result = await createReservation({
      customerName: custName,
      customerPhone: custPhone,
      tableId: selectedTableId,
      startTimeISO,
      guestCount: parseInt(guestCount, 10) || 2
    });

    const targetT = tables.find((t) => t.id === selectedTableId);
    const tableNum = targetT ? targetT.number : "";

    // Local state fallback
    try {
      const raw = localStorage.getItem("truffles_reservations");
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: "res-" + Date.now(),
        customer_name: custName,
        customer_phone: custPhone,
        table_id: selectedTableId,
        table_number: tableNum,
        start_time: startTimeISO,
        guest_count: guestCount,
        status: "confirmed",
        created_at: new Date().toISOString()
      });
      localStorage.setItem("truffles_reservations", JSON.stringify(list));
    } catch (err) {}

    setSubmitting(false);
    setShowAddModal(false);
    setSuccessMsg(`✓ Reservation created for ${custName} on Table T${tableNum}!`);
    setCustName("");
    setCustPhone("");
    setSelectedTableId("");
    loadAllReservations();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    await cancelReservation(id);

    try {
      const raw = localStorage.getItem("truffles_reservations");
      if (raw) {
        let list = JSON.parse(raw);
        list = list.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r));
        localStorage.setItem("truffles_reservations", JSON.stringify(list));
      }
    } catch (e) {}

    loadAllReservations();
  };

  const handleSeatCustomer = async (res) => {
    const targetTableId = res.table_id;
    if (targetTableId) {
      await updateTableStatus(targetTableId, "occupied");
    }
    await cancelReservation(res.id); // Or mark completed
    setSuccessMsg(`✓ Customer seated at Table!`);
    loadAllReservations();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const activeReservations = reservations.filter((r) => r.status === "confirmed");
  const historyReservations = reservations.filter((r) => r.status !== "confirmed");

  return (
    <div style={{ padding: "24px 32px", width: "100%", maxWidth: "1280px", margin: "0 auto", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", color: "#1A1A1A" }}>
            <CalendarDays size={24} color="#8B5CF6" />
            Table Reservations
          </h2>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "13px" }}>
            Manage table bookings, active reservations & past reservation logs
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={loadAllReservations}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 14px", borderRadius: "10px", border: "1px solid #E5E7EB",
              background: "#ffffff", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#374151"
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "10px", border: "none",
              background: "#234A3B", color: "#ffffff", cursor: "pointer", fontSize: "13px", fontWeight: 700
            }}
          >
            <Plus size={16} /> New Reservation
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
          color: "#16A34A", fontWeight: 600, fontSize: "14px", marginBottom: "16px"
        }}>
          {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", borderRadius: "12px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase" }}>ACTIVE BOOKINGS</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", fontFamily: "monospace", marginTop: "4px" }}>{activeReservations.length}</div>
        </div>
        <div style={{ padding: "16px", borderRadius: "12px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", textTransform: "uppercase" }}>AVAILABLE TABLES</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", fontFamily: "monospace", marginTop: "4px" }}>{vacantTables.length}</div>
        </div>
        <div style={{ padding: "16px", borderRadius: "12px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>PAST HISTORY</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", fontFamily: "monospace", marginTop: "4px" }}>{historyReservations.length}</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "8px 16px", borderRadius: "10px", border: "none",
            background: activeTab === "active" ? "#234A3B" : "#F3F4F6",
            color: activeTab === "active" ? "#ffffff" : "#4B5563",
            fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <span>📅 Active Reservations ({activeReservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 16px", borderRadius: "10px", border: "none",
            background: activeTab === "history" ? "#234A3B" : "#F3F4F6",
            color: activeTab === "history" ? "#ffffff" : "#4B5563",
            fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <span>📜 History Logs ({historyReservations.length})</span>
        </button>
      </div>

      {/* Main Reservation List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}>Loading reservations...</div>
      ) : activeTab === "active" ? (
        activeReservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#F9FAFB", borderRadius: "16px", border: "2px dashed #E5E7EB" }}>
            <CalendarDays size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
            <h3 style={{ color: "#6B7280", margin: "0 0 8px" }}>No Active Reservations</h3>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>Bookings created by customers or staff will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeReservations.map((res) => {
              const tableLabel = getTableLabel(res);
              const timeStr = new Date(res.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr = new Date(res.start_time).toLocaleDateString([], { month: "short", day: "numeric" });

              return (
                <div key={res.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: "12px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(139,92,246,0.12)", color: "#7E22CE", fontSize: "12px", fontWeight: 800 }}>
                        {tableLabel}
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{res.customer_name}</span>
                      {res.customer_phone && <span style={{ fontSize: "12px", color: "#6B7280" }}>{res.customer_phone}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#4B5563", marginTop: "2px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={13} color="#8B5CF6" /> {dateStr} at {timeStr}</span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Users size={13} color="#8B5CF6" /> {res.guest_count || 2} Guests</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleSeatCustomer(res)}
                      style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#10B981", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <CheckCircle size={14} /> Seat Customer
                    </button>
                    <button
                      onClick={() => handleCancel(res.id)}
                      style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        historyReservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#F9FAFB", borderRadius: "16px", border: "2px dashed #E5E7EB" }}>
            <h3 style={{ color: "#6B7280", margin: "0 0 8px" }}>No History Logs</h3>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>Past completed or cancelled reservations will be archived here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {historyReservations.map((res) => {
              const tableLabel = getTableLabel(res);
              return (
                <div key={res.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderRadius: "12px", background: "#F9FAFB", border: "1px solid #E5E7EB", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{res.customer_name}</span>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>{tableLabel}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                      {new Date(res.start_time).toLocaleString()} · {res.guest_count} Guests
                    </div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 800, background: res.status === "cancelled" ? "#FEE2E2" : "#E0E7FF", color: res.status === "cancelled" ? "#991B1B" : "#3730A3" }}>
                    {res.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add Reservation Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <form onSubmit={handleAddReservation} style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1A1A1A" }}>New Table Reservation</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Customer Name *</label>
                <input required type="text" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="e.g. Rahul Sharma" style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Phone Number</label>
                <input type="tel" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="+91 98765 43210" style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Date</label>
                  <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Time</label>
                  <input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Select Table *</label>
                <select required value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}>
                  <option value="">-- Choose Table --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>Table T{t.number || t.table_number} ({t.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Guests</label>
                <input type="number" min="1" max="20" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", background: "#234A3B", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  {submitting ? "Saving..." : "Create Reservation"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
