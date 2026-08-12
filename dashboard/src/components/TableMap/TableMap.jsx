import React, { useState, useEffect, useRef } from "react";
import { useResto } from "../../context/RestoContext";
import { supabase, fetchReservations } from "../../lib/supabase";
import { TableDetailModal } from "./TableDetailModal";
import { NewOrderModal } from "./NewOrderModal";
import { Users, Receipt, User, Phone, Sparkles, CalendarDays } from "lucide-react";

export const TableMap = () => {
  const { tables, activeOrders } = useResto();
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [reservations, setReservations] = useState([]);

  // Load reservations and subscribe to real-time updates
  const loadReservations = async () => {
    const data = await fetchReservations(new Date().toISOString().split("T")[0]);
    setReservations(data || []);
  };

  useEffect(() => {
    loadReservations();
    const channel = supabase
      .channel("table_map_reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => loadReservations())
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => loadReservations())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Always look up the LIVE table object from context — never store a stale snapshot
  const selectedTable = selectedTableId
    ? tables.find((t) => t.id === selectedTableId) || null
    : null;

  const isTableReserved = (table) => {
    if (table.status === "reserved") return true;
    return reservations.some(
      (r) => (r.table_id === table.id || r.table_id === String(table.number)) && r.status === "confirmed"
    );
  };

  const filteredTables = tables.filter((t) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "reserved") return isTableReserved(t);
    return t.status === filterStatus;
  });

  const getStatusBadgeLabel = (status) => {
    switch (status) {
      case "vacant": return "Vacant";
      case "occupied": return "Occupied";
      case "awaiting_payment": return "Awaiting Bill";
      case "needs_cleaning": return "Needs Cleaning";
      case "reserved": return "Reserved";
      default: return status;
    }
  };

  const renderTableBadge = (table) => {
    const tableOrder = (activeOrders || []).find(
      (o) => (o.tableId === table.id || o.table_id === table.id || o.tableNumber === table.number) &&
             o.status !== "Cancelled" && o.status !== "Completed" && o.payment_status !== "Paid"
    );

    if (isTableReserved(table)) {
      return (
        <span className="table-status-tag" style={{ backgroundColor: "#D97706", color: "#ffffff", fontWeight: 700 }}>
          RESERVED
        </span>
      );
    }

    if (table.status === "needs_cleaning") {
      return (
        <span className="table-status-tag" style={{ backgroundColor: "#F59E0B", color: "#ffffff", fontWeight: 700 }}>
          NEEDS CLEANING
        </span>
      );
    }

    if (table.status === "paid" || table.isPaid || tableOrder?.payment_status === "Paid") {
      return (
        <span className="table-status-tag" style={{ backgroundColor: "#8B5CF6", color: "#ffffff", fontWeight: 700 }}>
          PAID
        </span>
      );
    }

    if (table.status === "awaiting_payment" || table.status === "awaiting_bill") {
      return (
        <span className="table-status-tag" style={{ backgroundColor: "#F59E0B", color: "#ffffff", fontWeight: 700 }}>
          AWAITING BILL
        </span>
      );
    }

    if (tableOrder || table.status === "occupied") {
      return <span className="table-status-tag tag-occupied">Occupied</span>;
    }

    return <span className={`table-status-tag tag-${table.status}`}>{getStatusBadgeLabel(table.status)}</span>;
  };

  return (
    <div className="table-map-container">
      {/* Floor Control Header */}
      <div className="floor-control-bar">
        <div className="floor-info">
          <h2>Main Dining Floor</h2>
          <span className="subtitle">Visual Table Grid • Seated Customers &amp; Active Orders</span>
        </div>

        <div className="status-legend-bar">
          <div className="legend-item" onClick={() => setFilterStatus("all")}>
            <span className={`legend-chip ${filterStatus === "all" ? "active" : ""}`}>
              All ({tables.length})
            </span>
          </div>
          <div className="legend-item" onClick={() => setFilterStatus("vacant")}>
            <span className="dot dot-vacant"></span>
            <span className={`legend-chip ${filterStatus === "vacant" ? "active" : ""}`}>
              Vacant ({tables.filter((t) => t.status === "vacant").length})
            </span>
          </div>
          <div className="legend-item" onClick={() => setFilterStatus("occupied")}>
            <span className="dot dot-occupied"></span>
            <span className={`legend-chip ${filterStatus === "occupied" ? "active" : ""}`}>
              Occupied ({tables.filter((t) => t.status === "occupied").length})
            </span>
          </div>
          <div className="legend-item" onClick={() => setFilterStatus("awaiting_payment")}>
            <span className="dot dot-awaiting"></span>
            <span className={`legend-chip ${filterStatus === "awaiting_payment" ? "active" : ""}`}>
              Awaiting Bill ({tables.filter((t) => t.status === "awaiting_payment").length})
            </span>
          </div>
          <div className="legend-item" onClick={() => setFilterStatus("needs_cleaning")}>
            <span className="dot dot-cleaning"></span>
            <span className={`legend-chip ${filterStatus === "needs_cleaning" ? "active" : ""}`}>
              Needs Cleaning ({tables.filter((t) => t.status === "needs_cleaning").length})
            </span>
          </div>
          <div className="legend-item" onClick={() => setFilterStatus("reserved")}>
            <span className="dot dot-reserved"></span>
            <span className={`legend-chip ${filterStatus === "reserved" ? "active" : ""}`}>
              Reserved ({tables.filter((t) => t.status === "reserved").length})
            </span>
          </div>
        </div>
      </div>

      {/* Grid View T1 to T20 */}
      <div className="tables-grid">
        {filteredTables.map((table) => {
          const reserved = isTableReserved(table);
          const resObj = reservations.find(
            (r) => (r.table_id === table.id || r.table_id === String(table.number) || String(r.table_number) === String(table.number)) && r.status === "confirmed"
          );

          return (
            <div
              key={table.id}
              className={`table-card status-border-${reserved ? "reserved" : table.status}`}
              style={reserved ? { borderLeft: "4px solid #D97706" } : {}}
              onClick={() => setSelectedTableId(table.id)}
            >
              <div className="table-card-header">
                <span className="table-number">T{table.number || table.id}</span>
                {renderTableBadge(table)}
              </div>

              <div className="table-card-body">
                {reserved ? (
                  <div className="card-placeholder-text" style={{ gap: "4px" }}>
                    <CalendarDays size={18} color="#D97706" />
                    <span style={{ fontWeight: 700, color: "#D97706", fontSize: "13px" }}>
                      {resObj?.customer_name || table.customerName || "Reserved Guest"}
                    </span>
                    <small style={{ color: "#6B7280" }}>
                      {resObj?.guest_count || 2} Guests • Reserved
                    </small>
                  </div>
                ) : table.status === "occupied" || table.status === "awaiting_payment" ? (
                  <>
                    <div className="card-detail-row customer-name-row" style={{ color: "var(--accent)", fontWeight: 600 }}>
                      <User size={14} />
                      <span>{table.customerName || "Seated Guest"}</span>
                    </div>
                    {table.customerPhone && (
                      <div className="card-detail-row customer-phone-row" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        <Phone size={12} />
                        <span className="price-mono">{table.customerPhone}</span>
                      </div>
                    )}
                    <div className="card-detail-row">
                      <Users size={14} />
                      <span>{table.guests} Guests • Seated {table.seatedTime}</span>
                    </div>
                    <div className="card-detail-row active-total">
                      <Receipt size={14} />
                      <span className="total-val" style={{ color: table.isPaid ? "#16a34a" : "inherit" }}>
                        ₹{table.activeOrderTotal} {table.isPaid ? "(Paid)" : ""}
                      </span>
                    </div>
                  </>
                ) : table.status === "needs_cleaning" ? (
                  <div className="card-placeholder-text cleaning" style={{ gap: "6px" }}>
                    <Sparkles size={20} color="#2563EB" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                    <span style={{ color: "#2563EB", fontWeight: 700, fontSize: "12px", letterSpacing: "0.08em" }}>CLEANING IN PROGRESS</span>
                    <small style={{ color: "var(--text-muted)", fontSize: "10px" }}>Table will be ready soon</small>
                    <small style={{ color: "var(--text-muted)", fontSize: "10px" }}>⏱ Auto-clears in 20s</small>
                  </div>
                ) : (
                  <div className="card-placeholder-text vacant">
                    <span>Ready to Seat</span>
                    <small style={{ color: "var(--text-muted)", marginTop: "4px" }}>Customer Scans QR / Wi-Fi</small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail Modal — reads live table from context on every render */}
      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTableId(null)}
        />
      )}
    </div>
  );
};
