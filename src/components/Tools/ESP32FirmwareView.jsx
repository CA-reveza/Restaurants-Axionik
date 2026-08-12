import React, { useState } from "react";
import { Cpu, Wifi, Terminal, RefreshCw, CheckCircle, Shield } from "lucide-react";

export const ESP32FirmwareView = () => {
  const [apSSID, setApSSID] = useState("Truffles-Free-WiFi");
  const [ipAddress, setIpAddress] = useState("192.168.4.1");
  const [dnsHijackActive, setDnsHijackActive] = useState(true);
  const [activeClientsCount, setActiveClientsCount] = useState(14);

  const serialLogs = [
    "[SYSTEM] ESP32-S3 Dual Core 240MHz Boot Success",
    "[WIFI_AP] Access Point 'Truffles-Free-WiFi' Started (Channel 6)",
    `[SERVER] HTTP Web Server running at http://${ipAddress}:80`,
    "[DNS] DNS Hijack Server running on Port 53 (* -> 192.168.4.1)",
    "[CLIENT] Station 9A:F4:2C connected. Assigned IP 192.168.4.102",
    "[CAPTIVE] Redirecting http://connectivitycheck.gstatic.com/generate_204 to Portal",
    "[API] POST /api/checkin - Table T5 - Guest Connected",
    "[WEBSOCKET] Broadcasted order ORD-104 to KDS clients"
  ];

  return (
    <div className="esp32-view-container fade-in">
      <div className="analytics-header">
        <div>
          <h2>ESP32-S3 Captive Portal Hardware & Firmware Status</h2>
          <span className="caption-text">Wi-Fi Access Point, DNS Hijack Server, & Hardware Bridge</span>
        </div>

        <div className="badge-tag active">
          <Cpu size={16} /> ESP32-S3 Active • 240MHz
        </div>
      </div>

      {/* Hardware Status Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="card-top">
            <span className="caption-text">AP SSID</span>
            <Wifi size={18} color="#FF6B35" />
          </div>
          <div className="metric-value" style={{ fontSize: "18px", color: "#FFFFFF" }}>{apSSID}</div>
          <div className="caption-text">Channel 6 • 802.11 b/g/n</div>
        </div>

        <div className="metric-card">
          <div className="card-top">
            <span className="caption-text">Gateway IP</span>
            <Shield size={18} color="#7EE787" />
          </div>
          <div className="metric-value">{ipAddress}</div>
          <div className="caption-text">Subnet 255.255.255.0</div>
        </div>

        <div className="metric-card">
          <div className="card-top">
            <span className="caption-text">Active Connected Clients</span>
            <Wifi size={18} color="#FF6B35" />
          </div>
          <div className="metric-value">{activeClientsCount}</div>
          <div className="caption-text">DHCP Lease active</div>
        </div>

        <div className="metric-card">
          <div className="card-top">
            <span className="caption-text">DNS Hijack Mode</span>
            <CheckCircle size={18} color="#7EE787" />
          </div>
          <div className="metric-value" style={{ fontSize: "18px", color: "#7EE787" }}>
            {dnsHijackActive ? "ENABLED" : "DISABLED"}
          </div>
          <div className="caption-text">All DNS &rarr; 192.168.4.1</div>
        </div>
      </div>

      {/* Serial Monitor Output */}
      <div className="truffles-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={18} color="#FF6B35" />
            <h3 style={{ fontSize: "16px" }}>ESP32 Serial Monitor Output (115200 baud)</h3>
          </div>
          <span className="badge-tag">LIVE BUFFER</span>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", padding: "14px", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}>
          {serialLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
