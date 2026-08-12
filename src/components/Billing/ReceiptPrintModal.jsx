import React from "react";
import { X, Printer } from "lucide-react";

export const ReceiptPrintModal = ({ billData, onClose, onPrint }) => {
  if (!billData) return null;

  const {
    branch,
    tableName,
    orderId,
    items,
    subtotal,
    discountAmount,
    discountType,
    discountVal,
    serviceChargeAmount,
    cgst,
    sgst,
    grandTotal,
    dateStr
  } = billData;

  const handlePrintClick = () => {
    window.print();
    if (onPrint) onPrint();
  };

  return (
    <div className="modal-backdrop print-modal-backdrop" onClick={onClose}>
      <div className="modal-content print-receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2>Printable Thermal Receipt Preview</h2>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="thermal-receipt-paper" id="printable-receipt">
          <div className="receipt-header">
            <h1 className="receipt-brand">VELOCITY RESTAURANT</h1>
            <p className="receipt-branch">{branch}</p>
            <p className="receipt-info">GSTIN: 27AAAAA0000A1Z5</p>
            <p className="receipt-info">Date: {dateStr}</p>
            <div className="receipt-divider">--------------------------------</div>
            <div className="receipt-meta-row">
              <span>{tableName}</span>
              <span>{orderId}</span>
            </div>
            <div className="receipt-divider">--------------------------------</div>
          </div>

          <table className="receipt-items-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>QTY & ITEM</th>
                <th style={{ textAlign: "right" }}>RATE</th>
                <th style={{ textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: "left" }}>
                    {item.qty}x {item.name}
                  </td>
                  <td style={{ textAlign: "right" }}>₹{item.price}</td>
                  <td style={{ textAlign: "right" }}>₹{item.price * item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider">--------------------------------</div>

          <div className="receipt-totals-block">
            <div className="receipt-line">
              <span>Item Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="receipt-line discount">
                <span>Discount ({discountType === "percent" ? `${discountVal}%` : `Flat`})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {serviceChargeAmount > 0 && (
              <div className="receipt-line">
                <span>Service Charge (5%)</span>
                <span>+₹{serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="receipt-line">
              <span>CGST (2.5%)</span>
              <span>+₹{cgst.toFixed(2)}</span>
            </div>

            <div className="receipt-line">
              <span>SGST (2.5%)</span>
              <span>+₹{sgst.toFixed(2)}</span>
            </div>

            <div className="receipt-divider">================================</div>

            <div className="receipt-line grand-total-line">
              <span>GRAND TOTAL</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="receipt-divider">================================</div>
          </div>

          <div className="receipt-footer">
            <p>Thank you for dining with us!</p>
            <p>Please Visit Again</p>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary-action" onClick={handlePrintClick}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
