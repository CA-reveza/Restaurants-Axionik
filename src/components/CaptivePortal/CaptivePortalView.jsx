import React, { useState } from "react";
import { useResto } from "../../context/RestoContext";
import { executeDirectTableLogout } from "../../lib/supabase";
import { sizedImageUrl } from "../../lib/imageUtils";
import { Wifi, Smartphone, Utensils, Check, ShoppingBag, Plus, Minus, ArrowRight, User, LogOut } from "lucide-react";

export const CaptivePortalView = () => {
  const { menuItems, categories, createOrder, tables } = useResto();

  // Guest State
  const [step, setStep] = useState("connect"); // connect | menu | order_success
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("T1");

  const selectedTableObj = tables.find(
    (t) => t.id === selectedTableId || t.number === parseInt(String(selectedTableId).replace(/\D/g, ""), 10)
  );
  const displayTableLabel = selectedTableObj ? `Table ${selectedTableObj.number}` : `Table ${selectedTableId}`;

  const handleLogoutPortal = async () => {
    if (window.confirm("Disconnect Wi-Fi and return to check-in screen?")) {
      const tableToLogout = selectedTableId || localStorage.getItem("truffles_selected_table") || "1";
      console.log(`[Captive Portal Logout] Synchronously awaiting direct Supabase database updates for table: ${tableToLogout}...`);

      // 1. Await direct Supabase DB updates synchronously BEFORE clearing state/reloading
      await executeDirectTableLogout(tableToLogout);

      setCart([]);
      localStorage.removeItem("truffles_user_info");
      setStep("connect");
    }
  };

  // Menu & Cart
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [viewMode, setViewMode] = useState("phone"); // phone | full

  const handleConnectWifi = (e) => {
    e.preventDefault();
    if (!guestName || !phone) {
      alert("Please enter your name and phone number to connect to TRUFFLES High-Speed Wi-Fi.");
      return;
    }
    try {
      localStorage.setItem("truffles_selected_table", String(selectedTableId));
      localStorage.setItem("truffles_last_event", JSON.stringify({
        type: "TABLE_CHECKIN",
        tableId: selectedTableId,
        customerName: guestName,
        customerPhone: phone,
        timestamp: Date.now()
      }));
    } catch {}
    setStep("menu");
  };

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleUpdateQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);

    const orderItems = cart.map((i) => ({
      id: `cp-${Date.now()}-${Math.random()}`,
      menuItemId: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      customizations: []
    }));

    try {
      await createOrder({
        tableId: selectedTableId,
        items: orderItems,
        guests: 1,
        notes: `Order placed via Captive Portal by ${guestName} (${phone})`
      });
      setStep("order_success");
    } catch (err) {
      console.error("[CaptivePortalView] Failed to place order:", err);
      alert("Couldn't place your order — please check your connection and try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredDishes = menuItems.filter((i) => {
    if (activeCategory === "all") return true;
    return i.categoryId === activeCategory;
  });

  return (
    <div className="captive-portal-wrapper fade-in">
      {/* Top Banner Control Bar */}
      <div className="portal-control-header">
        <div>
          <h2>TRUFFLES Captive Guest Portal</h2>
          <p className="caption-text">Wi-Fi Gateway & Self-Ordering Customer Experience</p>
        </div>

        <div className="portal-mode-toggle">
          <button
            className={`mode-btn ${viewMode === "phone" ? "active" : ""}`}
            onClick={() => setViewMode("phone")}
          >
            <Smartphone size={16} /> Mobile Mockup
          </button>
          <button
            className={`mode-btn ${viewMode === "full" ? "active" : ""}`}
            onClick={() => setViewMode("full")}
          >
            <Wifi size={16} /> Full Screen Portal
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`portal-frame-container ${viewMode === "phone" ? "phone-mockup-frame" : "full-viewport-frame"}`}>
        {viewMode === "phone" && <div className="phone-notch"></div>}

        <div className="portal-content-body">
          {/* STEP 1: Wi-Fi Connect Check-in Form */}
          {step === "connect" && (
            <div className="wifi-checkin-card fade-in">
              <div className="portal-brand-header">
                <h1 className="brand-truffles-title" style={{ fontSize: "28px" }}>TRUFFLES</h1>
                <span className="brand-truffles-tagline">FREE HIGH-SPEED WI-FI</span>
              </div>

              <form onSubmit={handleConnectWifi} className="checkin-form">
                <div className="form-group">
                  <label className="caption-text">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="caption-text">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="caption-text">Seated Table</label>
                  <select
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Table {t.number}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                  <Wifi size={18} /> Connect Wi-Fi & View Menu <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Digital Self-Ordering Menu */}
          {step === "menu" && (
            <div className="digital-menu-view fade-in">
              <div className="menu-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="guest-welcome">
                  <span className="caption-text">Connected to TRUFFLES Wi-Fi</span>
                  <h3>Hello, {guestName} 👋</h3>
                  <small style={{ color: "#FF6B35" }}>{displayTableLabel}</small>
                </div>

                <button
                  onClick={handleLogoutPortal}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    borderRadius: "20px",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#EF4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                  title="Logout / Disconnect"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>

              <div className="portal-cat-pills">
                <button
                  className={`cat-pill ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => setActiveCategory("all")}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`cat-pill ${activeCategory === c.id ? "active" : ""}`}
                    onClick={() => setActiveCategory(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="portal-dishes-list">
                {filteredDishes.map((item) => {
                  const cartItem = cart.find((i) => i.id === item.id);
                  return (
                    <div key={item.id} className="portal-dish-card">
                      <img src={sizedImageUrl(item.image, 120)} alt={item.name} className="dish-thumb" loading="lazy" decoding="async" />
                      <div className="dish-details">
                        <div className="dish-head">
                          <span className="dish-name">{item.name}</span>
                          <span className={`veg-indicator-dot ${item.isVeg ? "veg" : "nonveg"}`}>
                            <span className="dot-inner"></span>
                          </span>
                        </div>
                        <p className="caption-text">{item.description}</p>
                        <div className="price-row">
                          <span className="price-mono">₹{item.price}</span>
                          {cartItem ? (
                            <div className="qty-picker">
                              <button onClick={() => handleUpdateQty(item.id, -1)}>-</button>
                              <span className="price-mono" style={{ fontSize: "13px" }}>{cartItem.qty}</span>
                              <button onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                            </div>
                          ) : (
                            <button className="btn-secondary" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => handleAddToCart(item)}>
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Cart Drawer */}
              {cart.length > 0 && (
                <div className="portal-cart-tray">
                  <div>
                    <span className="caption-text">{cart.reduce((s, i) => s + i.qty, 0)} Items Selected</span>
                    <div className="timer-stats-mono" style={{ fontSize: "18px" }}>₹{cartTotal}</div>
                  </div>
                  <button className="btn-primary" onClick={handlePlaceOrder}>
                    Place Table Order <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Order Success Screen */}
          {step === "order_success" && (
            <div className="order-success-view fade-in">
              <div className="success-icon-wrap">
                <Check size={36} color="#0A0A12" />
              </div>
              <h2>Order Sent to Kitchen!</h2>
              <p className="body-text">
                Your order for <strong>Table {selectedTableId}</strong> has been transmitted directly to our Kitchen Display System (KDS).
              </p>
              <div className="success-meta-box">
                <span className="caption-text">Wi-Fi Connection:</span>
                <strong style={{ color: "#7EE787" }}>Active (Unlimited 5G)</strong>
              </div>
              <button className="btn-secondary" onClick={() => setStep("menu")}>
                Order More Items
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
