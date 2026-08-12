import React, { useState, useEffect } from "react";
import { useResto } from "../../context/RestoContext";
import { ReceiptPrintModal } from "./ReceiptPrintModal";
import {
  CreditCard,
  QrCode,
  Banknote,
  Users,
  CheckCircle2,
  Printer,
  DollarSign,
  Percent,
  Check,
  Building2,
  AlertCircle
} from "lucide-react";

export const BillingStation = () => {
  const {
    tables,
    activeOrders,
    selectedTableForBilling,
    setSelectedTableForBilling,
    payOrder,
    currentBranch
  } = useResto();

  // Find occupied, awaiting payment, or active-order tables
  const billableTables = tables.filter((t) => {
    const hasOrder = activeOrders.some(
      (o) =>
        (o.tableId === t.id ||
         o.tableId === `T${t.number}` ||
         (typeof o.tableId === "string" && o.tableId.startsWith("T") && parseInt(o.tableId.replace("T", ""), 10) === t.number) ||
         o.tableId === t.number) &&
        o.status !== "Cancelled"
    );
    return t.status === "occupied" || t.status === "awaiting_payment" || hasOrder;
  });

  const [activeTableId, setActiveTableId] = useState(
    selectedTableForBilling || (billableTables[0] ? billableTables[0].id : "T1")
  );

  useEffect(() => {
    if (selectedTableForBilling) {
      setActiveTableId(selectedTableForBilling);
    }
  }, [selectedTableForBilling]);

  const activeTable = tables.find(
    (t) =>
      t.id === activeTableId ||
      (typeof activeTableId === "string" && activeTableId.startsWith("T") && t.number === parseInt(activeTableId.replace("T", ""), 10)) ||
      t.number === activeTableId
  );
  const activeTableNum = activeTable ? activeTable.number : (typeof activeTableId === "string" && activeTableId.startsWith("T") ? parseInt(activeTableId.replace("T", ""), 10) : 1);
  const activeTableUuid = activeTable ? activeTable.id : activeTableId;

  const activeOrder = activeOrders.find(
    (o) =>
      (o.tableId === activeTableId ||
       o.tableId === activeTableUuid ||
       o.tableId === `T${activeTableNum}` ||
       (typeof o.tableId === "string" && o.tableId.startsWith("T") && parseInt(o.tableId.replace("T", ""), 10) === activeTableNum) ||
       o.tableId === activeTableNum) &&
      o.status !== "Cancelled"
  );

  // Discount states
  const [discountType, setDiscountType] = useState("percent"); // percent | flat
  const [discountVal, setDiscountVal] = useState(0);

  // Service Charge toggle
  const [enableServiceCharge, setEnableServiceCharge] = useState(true);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi | card | cash | split

  // Cash payment fields
  const [cashTendered, setCashTendered] = useState("");

  // Split payment fields
  const [splitCount, setSplitCount] = useState(2);
  const [splitPaidStatus, setSplitPaidStatus] = useState({});

  // Print modal trigger
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Financial Calculations - Dynamically derived from underlying line items
  const activeLineItems = activeOrder ? (activeOrder.items || activeOrder.order_items || []) : [];
  const subtotal = activeLineItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1),
    0
  );

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = (subtotal * (parseFloat(discountVal) || 0)) / 100;
  } else {
    discountAmount = parseFloat(discountVal) || 0;
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  const afterDiscount = subtotal - discountAmount;
  const serviceChargeAmount = enableServiceCharge ? afterDiscount * 0.05 : 0;
  const taxableTotal = afterDiscount + serviceChargeAmount;

  const cgst = taxableTotal * 0.025; // 2.5%
  const sgst = taxableTotal * 0.025; // 2.5%

  const grandTotal = Math.round(taxableTotal + cgst + sgst);

  // Cash change calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeReturn = Math.max(0, tenderedNum - grandTotal);

  // Per person split amount
  const splitAmountPerPerson = Math.ceil(grandTotal / Math.max(1, splitCount));

  const handleMarkPaid = async () => {
    if (!activeOrder) return;

    await payOrder(activeOrder.id, {
      grandTotal,
      method: paymentMethod.toUpperCase(),
      discount: discountAmount,
      tax: cgst + sgst,
      serviceCharge: serviceChargeAmount
    });

    setShowPrintModal(true);
  };

  const billDataForPrint = activeOrder
    ? {
        branch: currentBranch,
        tableName: `Table ${activeTable.number} (${activeTable.id})`,
        orderId: activeOrder.id,
        items: activeOrder.items,
        subtotal,
        discountAmount,
        discountType,
        discountVal,
        serviceChargeAmount,
        cgst,
        sgst,
        grandTotal,
        dateStr: new Date().toLocaleString()
      }
    : null;

  // Generate SVG QR Code Payload (Dummy SVG QR pattern representation for high-fidelity UI)
  const renderUPIQRCode = (amount, label = "Table Bill") => {
    const upiPayload = `upi://pay?pa=velocityresto@icici&pn=VelocityResto&am=${amount}&cu=INR`;
    return (
      <div className="qr-code-box">
        <svg viewBox="0 0 100 100" className="qr-svg">
          <rect x="0" y="0" width="100" height="100" fill="#ffffff" rx="8" />
          {/* Outer QR Corner Markers */}
          <rect x="8" y="8" width="24" height="24" fill="#0f172a" />
          <rect x="12" y="12" width="16" height="16" fill="#ffffff" />
          <rect x="16" y="16" width="8" height="8" fill="#ff6b35" />

          <rect x="68" y="8" width="24" height="24" fill="#0f172a" />
          <rect x="72" y="12" width="16" height="16" fill="#ffffff" />
          <rect x="76" y="16" width="8" height="8" fill="#ff6b35" />

          <rect x="8" y="68" width="24" height="24" fill="#0f172a" />
          <rect x="12" y="72" width="16" height="16" fill="#ffffff" />
          <rect x="16" y="76" width="8" height="8" fill="#ff6b35" />

          {/* Random Data Bit Matrix */}
          <rect x="36" y="8" width="8" height="8" fill="#0f172a" />
          <rect x="48" y="16" width="8" height="8" fill="#0f172a" />
          <rect x="36" y="28" width="16" height="8" fill="#0f172a" />
          <rect x="16" y="44" width="8" height="12" fill="#0f172a" />
          <rect x="40" y="44" width="20" height="20" fill="#ff6b35" />
          <rect x="68" y="40" width="8" height="12" fill="#0f172a" />
          <rect x="80" y="56" width="12" height="8" fill="#0f172a" />
          <rect x="36" y="68" width="12" height="12" fill="#0f172a" />
          <rect x="56" y="76" width="16" height="8" fill="#0f172a" />
          <rect x="76" y="76" width="16" height="16" fill="#0f172a" />
        </svg>
        <span className="qr-label">Scan with GPay / PhonePe / Paytm</span>
        <span className="qr-amount">₹{amount}</span>
      </div>
    );
  };

  return (
    <div className="billing-station-container">
      {/* Table Selector Bar */}
      <div className="table-selector-strip">
        <span className="strip-title">Select Table for Settlement:</span>
        <div className="tables-pill-row">
          {tables.map((t) => {
            const hasOrder = activeOrders.some(
              (o) => o.tableId === t.id && o.status !== "Cancelled"
            );
            return (
              <button
                key={t.id}
                className={`table-select-pill ${t.id === activeTableId ? "active" : ""} ${
                  hasOrder ? "has-active-order" : "vacant-pill"
                }`}
                onClick={() => {
                  setActiveTableId(t.id);
                  setSelectedTableForBilling(t.id);
                }}
              >
                <span className="pill-table-id">T{t.number || t.id}</span>
                <span className="pill-status">
                  {hasOrder ? `₹${t.activeOrderTotal}` : "Vacant"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="billing-main-grid">
        {/* Left Column: Itemized Order & Adjustments */}
        <div className="invoice-details-card">
          <div className="card-header-row">
            <div>
              <h2>Billing Summary — Table {activeTable?.number}</h2>
              <span className="order-meta">
                {activeOrder ? `Order ID: ${activeOrder.id} • ${activeTable.guests} Guests` : "No active order on this table"}
              </span>
            </div>
            <button
              className="btn-print-bill"
              disabled={!activeOrder}
              onClick={() => setShowPrintModal(true)}
            >
              <Printer size={16} /> Print Bill
            </button>
          </div>

          {activeOrder ? (
            <>
              {/* Itemized Table */}
              <div className="itemized-table-wrapper">
                <table className="itemized-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="item-name-bold">{item.name}</div>
                          {item.customizations && item.customizations.length > 0 && (
                            <small className="cust-text">{item.customizations.join(", ")}</small>
                          )}
                        </td>
                        <td>{item.qty}</td>
                        <td>₹{item.price}</td>
                        <td className="text-right">₹{item.price * item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Editable Discounts & Charges Section */}
              <div className="adjustments-panel">
                {/* Discount Inputs */}
                <div className="discount-input-group">
                  <label className="adj-label">Apply Discount</label>
                  <div className="discount-controls">
                    <div className="toggle-switch-btns">
                      <button
                        className={discountType === "percent" ? "active" : ""}
                        onClick={() => setDiscountType("percent")}
                      >
                        <Percent size={14} /> %
                      </button>
                      <button
                        className={discountType === "flat" ? "active" : ""}
                        onClick={() => setDiscountType("flat")}
                      >
                        <DollarSign size={14} /> ₹
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      className="discount-val-input"
                      placeholder={discountType === "percent" ? "e.g. 10%" : "e.g. 150"}
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value)}
                    />
                  </div>
                </div>

                {/* Service Charge Toggle */}
                <div className="service-charge-toggle">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={enableServiceCharge}
                      onChange={(e) => setEnableServiceCharge(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span>Enable Service Charge (5%)</span>
                  </label>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bill-calculations-box">
                <div className="calc-row">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="calc-row discount-row">
                    <span>Discount Amount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {serviceChargeAmount > 0 && (
                  <div className="calc-row">
                    <span>Service Charge (5%)</span>
                    <span>+₹{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="calc-row tax-row">
                  <span>CGST (2.5%)</span>
                  <span>+₹{cgst.toFixed(2)}</span>
                </div>

                <div className="calc-row tax-row">
                  <span>SGST (2.5%)</span>
                  <span>+₹{sgst.toFixed(2)}</span>
                </div>

                <div className="calc-row grand-total">
                  <span>Grand Total</span>
                  <span className="grand-price">₹{grandTotal}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="no-bill-placeholder">
              <AlertCircle size={40} />
              <p>Table {activeTable?.number} is currently vacant or has no pending orders.</p>
            </div>
          )}
        </div>

        {/* Right Column: Payment Method & Mark Paid Action */}
        <div className="payment-checkout-card">
          <h2>Payment Method</h2>

          <div className="payment-tabs-grid">
            <button
              className={`pay-tab ${paymentMethod === "upi" ? "active" : ""}`}
              onClick={() => setPaymentMethod("upi")}
            >
              <QrCode size={20} />
              <span>UPI QR</span>
            </button>

            <button
              className={`pay-tab ${paymentMethod === "card" ? "active" : ""}`}
              onClick={() => setPaymentMethod("card")}
            >
              <CreditCard size={20} />
              <span>Card</span>
            </button>

            <button
              className={`pay-tab ${paymentMethod === "cash" ? "active" : ""}`}
              onClick={() => setPaymentMethod("cash")}
            >
              <Banknote size={20} />
              <span>Cash</span>
            </button>

            <button
              className={`pay-tab ${paymentMethod === "split" ? "active" : ""}`}
              onClick={() => setPaymentMethod("split")}
            >
              <Users size={20} />
              <span>Split Bill</span>
            </button>
          </div>

          {/* Payment Method Details View */}
          <div className="payment-method-body">
            {paymentMethod === "upi" && (
              <div className="upi-payment-view">
                {activeOrder ? (
                  renderUPIQRCode(grandTotal, `Table ${activeTable.number}`)
                ) : (
                  <p>Select an occupied table to generate UPI QR</p>
                )}
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="card-payment-view">
                <CreditCard size={48} className="terminal-icon" />
                <h3>Swipe / Tap Card on POS Terminal</h3>
                <p>Ensure terminal is synced via Bluetooth/Ethernet</p>
                <div className="card-amount-tag">Amount: ₹{grandTotal}</div>
              </div>
            )}

            {paymentMethod === "cash" && (
              <div className="cash-payment-view">
                <div className="input-field-group">
                  <label>Cash Tendered by Customer (₹)</label>
                  <input
                    type="number"
                    placeholder={`Min ₹${grandTotal}`}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                  />
                </div>

                <div className="change-return-box">
                  <span>Change Return to Customer:</span>
                  <span className="change-val">₹{changeReturn.toFixed(2)}</span>
                </div>
              </div>
            )}

            {paymentMethod === "split" && (
              <div className="split-payment-view">
                <div className="split-count-selector">
                  <label>Number of People Splitting:</label>
                  <div className="counter-input">
                    <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))}>-</button>
                    <span>{splitCount} Guests</span>
                    <button onClick={() => setSplitCount(splitCount + 1)}>+</button>
                  </div>
                </div>

                <div className="split-per-person-banner">
                  <span>Per Person Amount:</span>
                  <span className="split-price">₹{splitAmountPerPerson}</span>
                </div>

                <div className="split-qrs-grid">
                  {Array.from({ length: splitCount }).map((_, idx) => (
                    <div key={idx} className="split-person-card">
                      <span className="person-label">Guest #{idx + 1}</span>
                      <span className="person-price">₹{splitAmountPerPerson}</span>
                      <button
                        className={`person-pay-check ${
                          splitPaidStatus[idx] ? "paid" : ""
                        }`}
                        onClick={() =>
                          setSplitPaidStatus({
                            ...splitPaidStatus,
                            [idx]: !splitPaidStatus[idx]
                          })
                        }
                      >
                        {splitPaidStatus[idx] ? <Check size={14} /> : "Mark Paid"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mark Paid Submit Button */}
          <button
            className="btn-mark-paid"
            disabled={!activeOrder}
            onClick={handleMarkPaid}
          >
            <CheckCircle2 size={20} /> Mark Order Paid & Vacate Table
          </button>
        </div>
      </div>

      {/* Thermal Receipt Print Modal */}
      {showPrintModal && (
        <ReceiptPrintModal
          billData={billDataForPrint}
          onClose={() => setShowPrintModal(false)}
          onPrint={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
