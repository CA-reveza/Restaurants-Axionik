import React from "react";
import { useResto } from "../../context/RestoContext";
import { X, Clock, Flame, ArrowUpCircle, Trash2, CreditCard } from "lucide-react";

export const OrderDetailModal = ({ order, onClose }) => {
  const { updateOrderStatus, bumpOrderPriority, cancelOrder, goToBillingForTable } = useResto();

  if (!order) return null;

  const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleStatusChange = (newStatus) => {
    updateOrderStatus(order.id, newStatus);
  };

  const handleBump = () => {
    bumpOrderPriority(order.id);
  };

  const handleCancel = () => {
    if (window.confirm(`Are you sure you want to cancel order ${order.id}?`)) {
      cancelOrder(order.id);
      onClose();
    }
  };

  const handleProceedBilling = () => {
    onClose();
    goToBillingForTable(order.tableId);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>Order {order.id}</h2>
            <span className="table-badge">Table {order.tableId}</span>
            {order.priority === "high" && (
              <span className="high-priority-badge"><Flame size={14} /> HIGH PRIORITY</span>
            )}
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Pipeline Step Switcher */}
          <div className="order-pipeline-steps">
            {["New", "In Kitchen", "Ready", "Served", "Payment Pending"].map((step) => (
              <button
                key={step}
                className={`step-btn ${order.status === step ? "active-step" : ""}`}
                onClick={() => handleStatusChange(step)}
              >
                {step}
              </button>
            ))}
          </div>

          <div className="order-items-breakdown">
            <h3>Items in Order</h3>
            <div className="items-table-view">
              {order.items.map((item, idx) => (
                <div key={idx} className="item-row">
                  <span className="qty">{item.qty}x</span>
                  <div className="name-cust">
                    <span className="name">{item.name}</span>
                    {item.customizations && item.customizations.length > 0 && (
                      <span className="cust">{item.customizations.join(", ")}</span>
                    )}
                  </div>
                  <span className="unit-p">₹{item.price}</span>
                  <span className="sub-p">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="kitchen-notes-callout">
              <strong>Kitchen / Customer Note:</strong>
              <p>{order.notes}</p>
            </div>
          )}

          <div className="order-totals-summary">
            <span>Total Items: {order.items.reduce((s, i) => s + i.qty, 0)}</span>
            <span className="total-amount">Grand Subtotal: ₹{total}</span>
          </div>
        </div>

        <div className="modal-footer">
          <div className="left-actions">
            <button className="btn-bump" onClick={handleBump}>
              <ArrowUpCircle size={16} /> Bump KDS Priority
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              <Trash2 size={16} /> Cancel Order
            </button>
          </div>

          <button className="btn-primary-action" onClick={handleProceedBilling}>
            <CreditCard size={16} /> Open in Billing
          </button>
        </div>
      </div>
    </div>
  );
};
