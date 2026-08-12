import React, { useState, useEffect } from "react";
import { useResto } from "../../context/RestoContext";
import { OrderDetailModal } from "./OrderDetailModal";
import {
  RefreshCw,
  Search,
  ArrowUpDown,
  Eye,
  Trash2,
  ArrowUpCircle,
  Flame,
  Clock,
  Play,
  Pause,
  Filter
} from "lucide-react";

export const LiveOrders = () => {
  const { activeOrders, cancelOrder, bumpOrderPriority, updateOrderStatus } = useResto();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest
  const [autoRefreshActive, setAutoRefreshActive] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(3);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Timer for 3-second auto-refresh simulation & time elapsed updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      if (autoRefreshActive) {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            return 3;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshActive]);

  // Format Elapsed Time (e.g. 14m 20s)
  const getElapsedTimeStr = (createdAt) => {
    const start = new Date(createdAt).getTime();
    const diffMs = Math.max(0, currentTime - start);
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getElapsedTimeMins = (createdAt) => {
    const start = new Date(createdAt).getTime();
    return Math.floor((currentTime - start) / 60000);
  };

  // Filtering & Sorting
  const filteredOrders = activeOrders
    .filter((o) => {
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.tableId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Prioritize high priority orders first
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (a.priority !== "high" && b.priority === "high") return 1;

      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  const handleCancel = (orderId) => {
    if (window.confirm(`Are you sure you want to cancel order ${orderId}?`)) {
      cancelOrder(orderId);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "New":
        return "badge-new";
      case "In Kitchen":
        return "badge-kitchen";
      case "Ready":
        return "badge-ready";
      case "Served":
        return "badge-served";
      case "Payment Pending":
        return "badge-payment";
      default:
        return "";
    }
  };

  return (
    <div className="live-orders-container">
      {/* Top Controls & Auto Refresh Banner */}
      <div className="orders-header-bar">
        <div className="header-title-block">
          <h2>Live Orders Stream</h2>
          <span className="subtitle">Real-time KDS & Order Dispatch Monitor</span>
        </div>

        {/* Auto Refresh Indicator */}
        <div className="auto-refresh-widget">
          <button
            className={`toggle-refresh-btn ${autoRefreshActive ? "active" : ""}`}
            onClick={() => setAutoRefreshActive(!autoRefreshActive)}
          >
            {autoRefreshActive ? <Pause size={14} /> : <Play size={14} />}
            <span>Auto-sync: {autoRefreshActive ? `${refreshCountdown}s` : "Paused"}</span>
          </button>
          <div className="pulse-indicator">
            <span className={`pulse-ring ${autoRefreshActive ? "pulsing" : ""}`}></span>
            <RefreshCw size={14} className={autoRefreshActive ? "spinning" : ""} />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="orders-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search Order ID, Table, or Item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <span className="filter-label">Filter Status:</span>
          {["all", "New", "In Kitchen", "Ready", "Served", "Payment Pending"].map((st) => (
            <button
              key={st}
              className={`filter-chip ${statusFilter === st ? "active" : ""}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === "all" ? "All Orders" : st}
            </button>
          ))}
        </div>

        <button
          className="sort-btn"
          onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
        >
          <ArrowUpDown size={16} />
          <span>Time: {sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
        </button>
      </div>

      {/* Orders Data Table */}
      <div className="table-card-container">
        <table className="live-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table</th>
              <th>Customer Details</th>
              <th>Items Summary</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Time Elapsed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data-cell">
                  No active orders matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const mins = getElapsedTimeMins(order.createdAt);
                const isUrgent = mins > 25;
                const orderTotal = order.totalAmount !== undefined ? order.totalAmount : order.total !== undefined ? order.total : (order.items || []).reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0);

                return (
                  <tr
                    key={order.id}
                    className={`${order.priority === "high" ? "high-priority-row" : ""} ${
                      isUrgent ? "urgent-row" : ""
                    }`}
                  >
                    <td>
                      <div className="order-id-cell">
                        <span className="id-text">{order.id}</span>
                        {order.priority === "high" && (
                          <span className="flame-tag" title="High KDS Priority">
                            <Flame size={14} /> BUMPED
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="table-cell-badge">Table {order.tableId}</span>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 600, color: "var(--accent)", fontSize: "13px" }}>
                          {order.customerName || "Guest"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {order.customerPhone || "+91 98765 11111"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="items-summary-cell">
                        <div className="items-count-tag">{order.items.length} Items</div>
                        <span className="items-preview-text">
                          {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="price-mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)" }}>
                        ₹{orderTotal}
                      </span>
                    </td>

                    <td>
                      <select
                        className={`status-badge-select ${getStatusBadgeClass(order.status)}`}
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="In Kitchen">In Kitchen</option>
                        <option value="Ready">Ready</option>
                        <option value="Served">Served</option>
                        <option value="Payment Pending">Payment Pending</option>
                      </select>
                    </td>

                    <td>
                      <div className={`time-elapsed-cell ${isUrgent ? "urgent-time" : ""}`}>
                        <Clock size={14} />
                        <span>{getElapsedTimeStr(order.createdAt)}</span>
                      </div>
                    </td>

                    <td>
                      <div className="action-buttons-group">
                        <button
                          className="btn-action btn-view"
                          title="View Order Details"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          className="btn-action btn-bump-row"
                          title="Bump Priority to Top"
                          onClick={() => bumpOrderPriority(order.id)}
                        >
                          <ArrowUpCircle size={15} />
                        </button>

                        <button
                          className="btn-action btn-cancel-row"
                          title="Cancel Order"
                          onClick={() => handleCancel(order.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};
