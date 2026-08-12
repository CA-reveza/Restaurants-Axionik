import React, { useState } from "react";
import { QrCode, Download, Printer, RefreshCw } from "lucide-react";

export const QRCodeGenerator = () => {
  const [restaurantName, setRestaurantName] = useState("TRUFFLES");
  const [branch, setBranch] = useState("Koramangala");
  const [tableCount, setTableCount] = useState(20);

  const tablesList = Array.from({ length: tableCount }, (_, i) => `T${i + 1}`);

  const handleDownloadAll = () => {
    alert(`Downloading ${tableCount} printable QR code cards for ${restaurantName} (${branch})...`);
  };

  return (
    <div className="qr-generator-container fade-in">
      <div className="analytics-header">
        <div>
          <h2>Table QR Code Generator Tool</h2>
          <span className="caption-text">Generate & export table-specific QR codes for physical table displays</span>
        </div>

        <button className="btn-primary" onClick={handleDownloadAll}>
          <Download size={16} /> Download All PNG Cards
        </button>
      </div>

      {/* Control Inputs */}
      <div className="truffles-card form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div className="form-group">
          <label className="caption-text">Restaurant Brand Name</label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="caption-text">Branch Location</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="caption-text">Total Table Count</label>
          <input
            type="number"
            min="1"
            max="50"
            value={tableCount}
            onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      {/* Generated Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {tablesList.map((tId) => {
          const qrPayload = `https://truffles.app/menu?table=${tId}&branch=${encodeURIComponent(branch)}`;
          return (
            <div key={tId} className="truffles-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }}>
              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px" }}>
                <svg viewBox="0 0 100 100" style={{ width: "120px", height: "120px" }}>
                  <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
                  <rect x="8" y="8" width="28" height="28" fill="#1F1F1F" />
                  <rect x="12" y="12" width="20" height="20" fill="#FFFFFF" />
                  <rect x="16" y="16" width="12" height="12" fill="#234A3B" />

                  <rect x="64" y="8" width="28" height="28" fill="#1F1F1F" />
                  <rect x="68" y="12" width="20" height="20" fill="#FFFFFF" />
                  <rect x="72" y="16" width="12" height="12" fill="#234A3B" />

                  <rect x="8" y="64" width="28" height="28" fill="#1F1F1F" />
                  <rect x="12" y="68" width="20" height="20" fill="#FFFFFF" />
                  <rect x="16" y="72" width="12" height="12" fill="#234A3B" />

                  <rect x="42" y="8" width="12" height="12" fill="#1F1F1F" />
                  <rect x="42" y="42" width="16" height="16" fill="#234A3B" />
                  <rect x="64" y="42" width="12" height="12" fill="#1F1F1F" />
                  <rect x="42" y="68" width="16" height="16" fill="#1F1F1F" />
                  <rect x="68" y="68" width="16" height="16" fill="#1F1F1F" />
                </svg>
              </div>

              <div>
                <h3 className="brand-truffles-title" style={{ fontSize: "16px" }}>{restaurantName}</h3>
                <div className="timer-stats-mono" style={{ fontSize: "20px" }}>{tId}</div>
                <span className="caption-text">{branch} Branch</span>
              </div>

              <small className="caption-text" style={{ fontSize: "10px", wordBreak: "break-all" }}>{qrPayload}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
};
