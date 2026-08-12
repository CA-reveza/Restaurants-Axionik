import React from "react";
import { RestoProvider, useResto } from "./context/RestoContext";
import { Navbar } from "./components/Navbar";
import { TableMap } from "./components/TableMap/TableMap";
import { LiveOrders } from "./components/LiveOrders/LiveOrders";
import { BillingStation } from "./components/Billing/BillingStation";
import { MenuManager } from "./components/MenuManager/MenuManager";
import { RevenueAnalytics } from "./components/Analytics/RevenueAnalytics";
import { StaffManagement } from "./components/Dashboard/StaffManagement";
import { PreOrderQueue } from "./components/Dashboard/PreOrderQueue";
import { ReservationsDashboard } from "./components/Dashboard/ReservationsDashboard";
import { QRCodeGenerator } from "./components/Tools/QRCodeGenerator";
import { ESP32FirmwareView } from "./components/Tools/ESP32FirmwareView";
import "./App.css";

const AppShell = () => {
  const { activeTab } = useResto();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-viewport">
        {activeTab === "table_map" && <TableMap />}
        {activeTab === "live_orders" && <LiveOrders />}
        {activeTab === "billing" && <BillingStation />}
        {activeTab === "menu_manager" && <MenuManager />}
        {(activeTab === "analytics" || activeTab === "history") && (
          <RevenueAnalytics viewMode={activeTab === "history" ? "history" : "analytics"} />
        )}
        {activeTab === "staff" && <StaffManagement />}
        {activeTab === "qr_generator" && <QRCodeGenerator />}
        {activeTab === "esp32" && <ESP32FirmwareView />}
        {activeTab === "pre_order_queue" && <PreOrderQueue />}
        {activeTab === "reservations" && <ReservationsDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <RestoProvider>
      <AppShell />
    </RestoProvider>
  );
}
