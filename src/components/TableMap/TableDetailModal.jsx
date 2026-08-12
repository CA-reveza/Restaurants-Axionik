import React, { useState, useEffect } from "react";
import { useResto } from "../../context/RestoContext";
import {
  X,
  Users,
  Clock,
  Receipt,
  Plus,
  RefreshCw,
  Trash2,
  CreditCard,
  User,
  Phone,
  UtensilsCrossed,
  CheckCircle2,
  ChefHat
} from "lucide-react";

export const TableDetailModal = ({ table, onClose, onOpenNewOrder }) => {
  const {
    activeOrders,
    updateTableStatus,
    goToBillingForTable,
    cancelOrder
  } = useResto();

  const [selectedStatus, setSelectedStatus] = useState(table.status);

  // Sync state if table prop changes
  useEffect(() => {
    setSelectedStatus(table.status);
  }, [table.status]);

  const currentStatus = selectedStatus || table.status;

  // Extract table number for universal matching (T1 to T20)
  const tableNum = table.number;

  // Find active order for this table across all table ID formats
  const activeOrder = activeOrders.find(
    (o) =>
      (o.tableId === table.id ||
       o.tableId === `T${tableNum}` ||
       (typeof o.tableId === "string" && o.tableId.startsWith("T") && parseInt(o.tableId.replace("T", ""), 10) === tableNum) ||
       o.tableId === tableNum) &&
      o.status !== "Cancelled"
  );

  const customerName = activeOrder?.customerName || table.customerName || `Customer (Table T${tableNum})`;
  const customerPhone = activeOrder?.customerPhone || table.customerPhone || "+91 98765 11111";

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    updateTableStatus(table.id, newStatus);
  };

  const handleGenerateBill = () => {
    onClose();
    goToBillingForTable(table.id);
  };

  const statusOptions = [
    { value: "vacant", label: "Vacant", color: "#7EE787" },
    { value: "occupied", label: "Occupied", color: "#EF4444" },
    { value: "awaiting_payment", label: "Awaiting Bill", color: "#FACC15" },
    { value: "needs_cleaning", label: "Needs Cleaning", color: "#3B82F6" },
    { value: "reserved", label: "Reserved", color: "#8B5CF6" }
  ];

  const getItemStatusBadge = (status) => {
    switch (status) {
      case "New":
        return <span className="badge-tag" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60A5FA" }}>NEW</span>;
      case "In Kitchen":
        return <span className="badge-tag" style={{ background: "rgba(250, 204, 21, 0.15)", color: "#FACC15" }}>IN KITCHEN</span>;
      case "Ready":
        return <span className="badge-tag" style={{ background: "rgba(126, 231, 135, 0.15)", color: "#7EE787" }}>READY</span>;
      case "Served":
        return <span className="badge-tag" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#C084FC" }}>SERVED</span>;
      default:
        return <span className="badge-tag">{status}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content table-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="modal-title-group">
            <h2>Table {tableNum} (T{tableNum}) Customer & Order</h2>
            <span
              className={`table-status-tag tag-${currentStatus}`}
              style={
                currentStatus === "reserved"
                  ? { backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", fontWeight: 700 }
                  : currentStatus === "occupied"
                  ? { backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontWeight: 700 }
                  : {}
              }
            >
              {currentStatus.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          
          {/* Customer Profile Header Box */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--bg-tertiary)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
                  <User size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-primary)", fontWeight: 700 }}>{customerName}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    <Phone size={12} />
                    <span className="price-mono">{customerPhone}</span>
                  </div>
                </div>
              </div>

              {activeOrder && getItemStatusBadge(activeOrder.status)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", background: "var(--bg-primary)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }}>
              <div>
                <span className="caption-text" style={{ display: "block", fontSize: "10px" }}>SEATED GUESTS</span>
                <strong style={{ color: "var(--text-primary)" }}>{table.guests || 2} Guests</strong>
              </div>
              <div>
                <span className="caption-text" style={{ display: "block", fontSize: "10px" }}>SEATED TIME</span>
                <strong style={{ color: "var(--text-primary)" }}>{table.seatedTime || "Just Seated"}</strong>
              </div>
              <div>
                <span className="caption-text" style={{ display: "block", fontSize: "10px" }}>TOTAL BILL</span>
                <strong className="timer-stats-mono" style={{ color: "var(--accent)", fontSize: "14px" }}>₹{activeOrder ? (activeOrder.totalAmount !== undefined ? activeOrder.totalAmount : activeOrder.total !== undefined ? activeOrder.total : activeOrder.items.reduce((s, i) => s + i.price * i.qty, 0)) : table.activeOrderTotal || 0}</strong>
              </div>
            </div>
          </div>

          {/* Quick Table Status Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="caption-text" style={{ whiteSpace: "nowrap" }}>Status:</span>
            <div className="status-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", flex: 1 }}>
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`status-opt-btn ${currentStatus === opt.value ? "selected" : ""}`}
                  onClick={() => handleStatusChange(opt.value)}
                  style={{ padding: "6px 8px", fontSize: "11px" }}
                >
                  <span className="dot" style={{ backgroundColor: opt.color }}></span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer's Itemized Order */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <UtensilsCrossed size={16} color="var(--accent)" />
                <h4 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>Customer's Ordered Items</h4>
              </div>
              {activeOrder && <span className="price-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>ID: {activeOrder.id}</span>}
            </div>

            {activeOrder && activeOrder.items && activeOrder.items.length > 0 ? (
              <div className="order-items-list" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="order-item-row" style={{ padding: "8px 0", borderBottom: idx === activeOrder.items.length - 1 ? "none" : "1px solid var(--border)" }}>
                    <div className="item-qty-badge">{item.qty}x</div>
                    <div className="item-details" style={{ flex: 1, margin: "0 12px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{item.name}</div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          + {item.customizations.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="item-price" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>
                      ₹{item.price * item.qty}
                    </div>
                  </div>
                ))}

                {activeOrder.notes && (
                  <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(139, 107, 74, 0.1)", border: "1px solid #8B6B4A", borderRadius: "6px", color: "#8B6B4A", fontSize: "12px" }}>
                    <strong>Customer Note:</strong> {activeOrder.notes}
                  </div>
                )}

                {/* Bill Breakdown */}
                {(activeOrder.subtotal !== undefined || activeOrder.taxes !== undefined) && (
                  <div style={{ marginTop: "10px", borderTop: "1px solid var(--border)", paddingTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>Subtotal</span>
                      <span className="price-mono">₹{activeOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    {activeOrder.taxes > 0 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span>CGST (2.5%)</span>
                          <span className="price-mono">₹{(activeOrder.taxes / 2).toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span>SGST (2.5%)</span>
                          <span className="price-mono">₹{(activeOrder.taxes / 2).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {activeOrder.serviceCharge > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span>Service Charge (5%)</span>
                        <span className="price-mono">₹{activeOrder.serviceCharge?.toFixed(2)}</span>
                      </div>
                    )}
                    {activeOrder.discount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#16A34A" }}>
                        <span>Special Truffles Discount</span>
                        <span className="price-mono">– ₹{activeOrder.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", fontWeight: 700, color: "var(--accent)", fontSize: "14px" }}>
                      <span>TOTAL BILL</span>
                      <span className="price-mono">₹{(activeOrder.totalAmount ?? activeOrder.total ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                No active order placed yet for Table {tableNum}.
              </div>
            )}
          </div>

        </div>

        {/* Modal Actions */}
        <div className="modal-footer" style={{ borderTop: "1px solid var(--border)", padding: "14px 20px" }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>

          {activeOrder && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-action"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #DC2626", padding: "8px 14px" }}
                onClick={() => {
                  if (window.confirm(`Cancel order ${activeOrder.id}?`)) {
                    cancelOrder(activeOrder.id);
                    onClose();
                  }
                }}
              >
                <Trash2 size={14} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
