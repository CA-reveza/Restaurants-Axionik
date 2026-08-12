import React, { Suspense, lazy } from "react";
import { RestoProvider, useResto } from "./context/RestoContext";
import { Navbar } from "./components/Navbar";
import "./App.css";

// Every tab used to be a static import, so all three deployed entry points
// (dashboard/kds/portal — see vite.config.js) shipped the ENTIRE app in their
// initial bundle: the 1550-line CustomerApp, KDS, Billing, Analytics, etc. all
// downloaded and parsed before a single pixel painted, even on the kiosk-mode
// captive portal which only ever renders CustomerAppContainer. Lazy-loading
// per tab means each entry point's initial JS is just what that screen needs;
// the rest streams in on demand right as activeTab switches to it.
const TableMap = lazy(() => import("./components/TableMap/TableMap").then((m) => ({ default: m.TableMap })));
const LiveOrders = lazy(() => import("./components/LiveOrders/LiveOrders").then((m) => ({ default: m.LiveOrders })));
const KitchenDisplaySystem = lazy(() =>
  import("./components/KDS/KitchenDisplaySystem").then((m) => ({ default: m.KitchenDisplaySystem }))
);
const BillingStation = lazy(() => import("./components/Billing/BillingStation").then((m) => ({ default: m.BillingStation })));
const MenuManager = lazy(() => import("./components/MenuManager/MenuManager").then((m) => ({ default: m.MenuManager })));
const RevenueAnalytics = lazy(() =>
  import("./components/Analytics/RevenueAnalytics").then((m) => ({ default: m.RevenueAnalytics }))
);
const StaffManagement = lazy(() => import("./components/Dashboard/StaffManagement").then((m) => ({ default: m.StaffManagement })));
const PreOrderQueue = lazy(() => import("./components/Dashboard/PreOrderQueue").then((m) => ({ default: m.PreOrderQueue })));
const ReservationsDashboard = lazy(() =>
  import("./components/Dashboard/ReservationsDashboard").then((m) => ({ default: m.ReservationsDashboard }))
);
const QRCodeGenerator = lazy(() => import("./components/Tools/QRCodeGenerator").then((m) => ({ default: m.QRCodeGenerator })));
const ESP32FirmwareView = lazy(() =>
  import("./components/Tools/ESP32FirmwareView").then((m) => ({ default: m.ESP32FirmwareView }))
);
const CustomerAppContainer = lazy(() =>
  import("./components/CustomerApp/CustomerAppContainer").then((m) => ({ default: m.CustomerAppContainer }))
);
// Note: CaptivePortalView (src/components/CaptivePortal/CaptivePortalView.jsx) was previously
// imported here but never rendered anywhere in AppShell — both the "captive_portal" and
// "customer_app" tabs render CustomerAppContainer. Removed the dead import; the component
// file itself is left in place in case it's wired up again later.

const AppShell = () => {
  const { activeTab } = useResto();

  // 1. Standalone Customer App / Captive Portal (No POS Navbar)
  if (activeTab === "captive_portal" || activeTab === "customer_app") {
    return (
      <div className="standalone-viewport">
        <Suspense fallback={<TabLoadingFallback />}>
          <CustomerAppContainer />
        </Suspense>
      </div>
    );
  }

  // 2. Standalone Kitchen KDS Display (No POS Navbar)
  if (activeTab === "kds") {
    return (
      <div className="standalone-viewport" style={{ height: "100vh", overflow: "hidden" }}>
        <Suspense fallback={<TabLoadingFallback />}>
          <KitchenDisplaySystem />
        </Suspense>
      </div>
    );
  }

  // 3. Kitchen POS & Admin Dashboard Shell (With Navbar)
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-viewport">
        <Suspense fallback={<TabLoadingFallback />}>
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
        </Suspense>
      </main>
    </div>
  );
};

const TabLoadingFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "200px", opacity: 0.6 }}>
    Loading…
  </div>
);

export default function App() {
  return (
    <RestoProvider>
      <AppShell />
    </RestoProvider>
  );
}
