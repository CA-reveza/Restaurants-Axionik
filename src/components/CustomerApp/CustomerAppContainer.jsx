import React, { useState, useEffect, useMemo, useRef } from "react";
import { useResto } from "../../context/RestoContext";
import {
  createReservation,
  fetchReservations,
  checkTableAvailability,
  createPreOrder,
} from "../../lib/supabase";
import { supabase } from "../../lib/supabase";
import { sizedImageUrl } from "../../lib/imageUtils";
import {
  Wifi,
  ShoppingBag,
  Search,
  CheckCircle,
  Clock,
  QrCode,
  CreditCard,
  Banknote,
  Star,
  Plus,
  Minus,
  X,
  ChefHat,
  Bell,
  Hand,
  ArrowRight,
  Filter,
  Flame,
  Camera,
  Check,
  AlertTriangle,
  LogOut,
  CalendarDays,
  Ticket,
  Users,
} from "lucide-react";

export const CustomerAppContainer = () => {
  const {
    menuItems,
    categories,
    createOrder,
    tables,
    activeOrders,
    updateOrderStatus,
    updateTableStatus,
    submitCustomerFeedback
  } = useResto();

  // Navigation sub-screens for Customer App:
  // 1: portal, 2: otp_verify, 3: table_confirm, 4: menu, 5: tracking, 6: bill_pay, 7: feedback
  // 8: reserve_modal, 9: preorder_modal, 10: preorder_success
  const [screen, setScreen] = useState("portal");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["1", "2", "3", "4"]);
  const [otpError, setOtpError] = useState("");

  // Table selection priority: URL "table" param (from a per-table QR code) >
  // last table this browser used (localStorage) > hardcoded default. Reading
  // the URL param is what actually makes "scan the QR code at your table"
  // pre-select the right table — previously nothing in this component read
  // any URL param at all, so every QR code (regardless of which table it
  // encoded) landed the customer on the same default table.
  const [selectedTable, setSelectedTable] = useState(() => {
    try {
      const tableParam = new URLSearchParams(window.location.search).get("table");
      if (tableParam) return tableParam;
    } catch (e) { /* ignore */ }
    return localStorage.getItem("truffles_guest_table") || "T5";
  });
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Save guest table selection to localStorage
  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem("truffles_guest_table", selectedTable);
    }
  }, [selectedTable]);

  // Self-heal from a stale cached table UUID: if the DB was ever reset/
  // recreated (new Supabase project = brand new random UUIDs for every
  // table), a browser that already had a table cached in localStorage from
  // before the reset ends up "selecting" a UUID that matches nothing in the
  // current database. createOrderInDb trusts any syntactically-valid UUID
  // without checking it actually exists, so this failed silently rather
  // than falling back — orders got created against (or rejected for) a
  // table_id nothing else could ever match. Once real tables have loaded,
  // if selectedTable looks like a UUID but isn't among them, drop back to
  // the first real table instead of continuing to use a dead reference.
  useEffect(() => {
    if (!tables || tables.length === 0) return;
    const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedTable || "");
    if (looksLikeUuid && !tables.some((t) => t.id === selectedTable)) {
      setSelectedTable(tables[0].id);
    }
  }, [tables, selectedTable]);

  // Search, Filter, Sort in Menu
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular"); // popular | price_asc | price_desc

  // Customization Bottom Sheet state
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishQty, setDishQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [dishNotes, setDishNotes] = useState("");

  // Cart Drawer State
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [cart, setCart] = useState([]);

  // Active Order tracking
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Bill & Pay state
  const [payMethod, setPayMethod] = useState("upi");
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [splitPeople, setSplitPeople] = useState(2);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // ── RESERVATION STATE ──
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [resDate, setResDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [resTime, setResTime] = useState("19:00");
  const [resGuests, setResGuests] = useState(2);
  const [resTableId, setResTableId] = useState("");
  const [resAvailability, setResAvailability] = useState({}); // tableId -> boolean
  const [resLoading, setResLoading] = useState(false);
  const [resSuccess, setResSuccess] = useState(null);
  const [resError, setResError] = useState("");

  // ── PRE-ORDER STATE ──
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [preOrderCart, setPreOrderCart] = useState([]);
  const [preOrderSubmitting, setPreOrderSubmitting] = useState(false);
  const [preOrderTicket, setPreOrderTicket] = useState(null);
  const [preOrderDish, setPreOrderDish] = useState(null);
  const [preOrderDishQty, setPreOrderDishQty] = useState(1);
  const [preOrderAddons, setPreOrderAddons] = useState([]);
  const [preOrderSearch, setPreOrderSearch] = useState("");
  const [preOrderCategory, setPreOrderCategory] = useState("all");

  // `selectedTable` deliberately stores the table's raw UUID (it has to,
  // to match the <select>'s <option value={t.id}> and to pass straight
  // through to order creation) — but showing that UUID directly to the
  // customer ("You are at Table f43ca044-4817-...") is meaningless to them.
  // This resolves it to the human-facing table number for display only;
  // every functional use of selectedTable elsewhere is untouched.
  const selectedTableNumber = (() => {
    const match = tables.find((t) => t.id === selectedTable);
    if (match) return match.number;
    const digits = String(selectedTable).replace(/\D/g, "");
    return digits || selectedTable;
  })();

  // Table active order check (excludes Completed, Paid, or Cancelled)
  const existingOrderForTable = activeOrders.find(
    (o) => (o.tableId === selectedTable || o.table_id === selectedTable) &&
           o.status !== "Cancelled" &&
           o.status !== "Completed" &&
           o.payment_status !== "Paid"
  );

  // ── RESERVATION HANDLERS ──
  // Generate 30-min time slots from 11:00 to 23:00
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const totalMins = 11 * 60 + i * 30;
    const h = String(Math.floor(totalMins / 60)).padStart(2, "0");
    const m = String(totalMins % 60).padStart(2, "0");
    return `${h}:${m}`;
  });

  // Recheck availability whenever date/time changes
  useEffect(() => {
    if (!showReserveModal) return;
    const checkAll = async () => {
      const startISO = new Date(`${resDate}T${resTime}:00`).toISOString();
      const endISO = new Date(new Date(`${resDate}T${resTime}:00`).getTime() + 90 * 60 * 1000).toISOString();
      const avail = {};
      await Promise.all(
        tables.map(async (t) => {
          const ok = await checkTableAvailability(t.id, startISO, endISO);
          avail[t.id] = ok;
        })
      );
      setResAvailability(avail);
    };
    checkAll();
  }, [resDate, resTime, showReserveModal, tables]);

  const handleSubmitReservation = async () => {
    if (!resTableId) { setResError("Please select a table."); return; }
    setResLoading(true);
    setResError("");
    const startISO = new Date(`${resDate}T${resTime}:00`).toISOString();
    const result = await createReservation({
      customerName: customerName || "Guest",
      customerPhone: customerPhone || "",
      tableId: resTableId,
      startTime: startISO,
      guestCount: resGuests,
      durationMinutes: 90,
    });
    setResLoading(false);
    if (result.error) {
      setResError(result.message || "This table is already reserved. Please choose another.");
    } else {
      try {
        await supabase
          .from("restaurant_tables")
          .update({ status: "reserved" })
          .eq("id", resTableId);
      } catch (e) {}
      setResSuccess(result.data);
      setSelectedTable(null);
    }
  };

  // ── PRE-ORDER HANDLERS ──
  const preOrderSubtotal = preOrderCart.reduce((s, i) => s + i.total, 0);

  const handleAddToPreOrderCart = () => {
    if (!preOrderDish) return;
    const itemTotal = (preOrderDish.price + preOrderAddons.reduce((s, a) => s + a.price, 0)) * preOrderDishQty;
    setPreOrderCart((prev) => [...prev, {
      cartId: `po-${Date.now()}`,
      id: preOrderDish.id,
      menuItemId: preOrderDish.id,
      name: preOrderDish.name,
      basePrice: preOrderDish.price,
      price: preOrderDish.price + preOrderAddons.reduce((s, a) => s + a.price, 0),
      qty: preOrderDishQty,
      addons: preOrderAddons,
      total: itemTotal,
      image: preOrderDish.image,
      customizations: preOrderAddons.map((a) => a.name),
    }]);
    setPreOrderDish(null);
    setPreOrderDishQty(1);
    setPreOrderAddons([]);
  };

  const handleSubmitPreOrder = async () => {
    if (preOrderCart.length === 0) return;
    setPreOrderSubmitting(true);
    const result = await createPreOrder({
      customerName: customerName || "Guest",
      customerPhone: customerPhone || "",
      items: preOrderCart.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        customizations: i.customizations,
      })),
      totalAmount: preOrderSubtotal,
      notes: "",
    });
    setPreOrderSubmitting(false);
    if (result.ticket) {
      setPreOrderTicket(result.ticket);
      setPreOrderCart([]);
      setShowPreOrderModal(false);
      setScreen("preorder_success");
    }
  };

  // This filters the entire menu on every keystroke in the pre-order search
  // box, every category click, and — since it wasn't memoized — on every one
  // of this component's ~30 other pieces of local state changing too (e.g.
  // typing in the customer name field, opening/closing modals). useMemo
  // scopes the recompute to only when the inputs it actually reads change.
  const preOrderMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const matchCat = preOrderCategory === "all" || item.categoryId === preOrderCategory;
        const matchSearch = item.name.toLowerCase().includes(preOrderSearch.toLowerCase());
        return matchCat && matchSearch;
      }),
    [menuItems, preOrderCategory, preOrderSearch]
  );

  const handleTableCheckIn = async (newTableId) => {
    try {
      const custName = customerName || "Guest";
      const { data: openOrders } = await supabase
        .from("orders")
        .select("id, table_id")
        .eq("customer_name", custName)
        .in("order_status", ["New", "Preparing", "Ready"])
        .neq("payment_status", "Paid");

      if (openOrders && openOrders.length > 0) {
        for (const orphanOrder of openOrders) {
          if (orphanOrder.table_id && orphanOrder.table_id !== newTableId) {
            await supabase
              .from("orders")
              .update({ order_status: "Cancelled" })
              .eq("id", orphanOrder.id);

            await supabase
              .from("restaurant_tables")
              .update({ status: "vacant" })
              .eq("id", orphanOrder.table_id);
          }
        }
      }

      await updateTableStatus(newTableId, "occupied");
    } catch (err) {
      console.error("Failed to handle multi-table check-in:", err);
    }
  };

  // Handle Bottom Sheet Customization Add
  const handleOpenCustomization = (dish) => {
    setSelectedDish(dish);
    setDishQty(1);
    setSelectedAddons([]);
    setDishNotes("");
  };

  const handleAddonToggle = (addon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirmAddToCart = () => {
    if (!selectedDish) return;
    const itemTotal =
      (selectedDish.price +
        selectedAddons.reduce((sum, a) => sum + a.price, 0)) *
      dishQty;

    const cartEntry = {
      cartId: `citem-${Date.now()}-${Math.random()}`,
      id: selectedDish.id,
      name: selectedDish.name,
      basePrice: selectedDish.price,
      qty: dishQty,
      addons: selectedAddons,
      notes: dishNotes,
      total: itemTotal,
      image: selectedDish.image
    };

    setCart([...cart, cartEntry]);
    setSelectedDish(null);
  };

  // Cart calculation
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState("");
  // useState alone has a small window: two clicks in the same tick both read
  // isPlacingOrder as false before either re-render commits, so both pass
  // the guard. A ref updates synchronously and closes that window entirely.
  const isPlacingOrderRef = useRef(false);

  const handlePlaceOrder = async () => {
    // Without this guard, a customer tapping "Place Order" more than once
    // while the first request is still in flight (slow network, no visual
    // feedback that it's working) fires handlePlaceOrder() again with the
    // same non-empty cart before setCart([]) below has run — each tap
    // creates its own separate, identical order. This is exactly what
    // produced duplicate orders for the same item/table in testing.
    if (cart.length === 0 || isPlacingOrderRef.current) return;
    isPlacingOrderRef.current = true;
    setIsPlacingOrder(true);
    setPlaceOrderError("");

    try {
      const orderItems = cart.map((i) => ({
        id: `oi-${Date.now()}-${Math.random()}`,
        menuItemId: i.id,
        name: i.name,
        price: i.basePrice + i.addons.reduce((s, a) => s + a.price, 0),
        qty: i.qty,
        customizations: i.addons.map((a) => a.name)
      }));

      const newOrdId = await createOrder({
        tableId: selectedTable,
        items: orderItems,
        guests: 2,
        notes: cart.map((c) => c.notes).filter(Boolean).join("; "),
        customerName: customerName || "Guest",
        customerPhone: customerPhone || ""
      });

      if (!newOrdId) {
        throw new Error("Order was not created — no order ID returned.");
      }

      setActiveOrderId(newOrdId);
      setCart([]);
      setShowCartDrawer(false);
      setScreen("tracking");
    } catch (err) {
      // Previously a failure here was completely silent — the button just
      // went back to normal with zero feedback, which is exactly the
      // situation that invites someone to assume nothing happened and tap
      // "Place Order" again, potentially creating a real duplicate if the
      // original request actually succeeded server-side despite the client
      // seeing it fail (e.g. a slow response that times out client-side).
      console.error("[CustomerApp] Failed to place order:", err);
      setPlaceOrderError("Couldn't place your order — check your connection and try again. If you already tried once, wait a few seconds before retrying to avoid a duplicate order.");
    } finally {
      isPlacingOrderRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  // Filtered & Sorted Menu Items — the customer-facing menu list, which was
  // re-filtering and re-sorting the entire menu on every render of this
  // component (every keystroke anywhere in the ~30-piece local state, every
  // modal open/close, every cart change). useMemo scopes that to only when
  // the menu, category, search text, veg toggle, or sort order actually change.
  const processedMenuItems = useMemo(
    () =>
      menuItems
        .filter((item) => {
          const matchCat = activeCategory === "all" || item.categoryId === activeCategory;
          const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchVeg = !vegOnly || item.isVeg;
          return matchCat && matchSearch && matchVeg;
        })
        .sort((a, b) => {
          if (sortBy === "price_asc") return a.price - b.price;
          if (sortBy === "price_desc") return b.price - a.price;
          return 0; // popular default
        }),
    [menuItems, activeCategory, searchQuery, vegOnly, sortBy]
  );

  // Current tracked order
  const trackedOrder = activeOrders.find((o) => o.id === activeOrderId) || existingOrderForTable;

  // Bill tax calculations
  const orderSubtotal = trackedOrder
    ? trackedOrder.items.reduce((s, i) => s + i.price * i.qty, 0)
    : 0;
  const cgst = orderSubtotal * 0.025;
  const sgst = orderSubtotal * 0.025;
  const serviceCharge = orderSubtotal * 0.05;
  const grandTotal = Math.round(orderSubtotal + cgst + sgst + serviceCharge);
  const perPersonAmount = Math.ceil(grandTotal / Math.max(1, splitPeople));

  const handlePaySuccess = async () => {
    setPaymentSuccess(true);

    const targetOrderId = trackedOrder?.id;
    const targetTableId = selectedTable || trackedOrder?.tableId;

    if (targetOrderId) {
      await payOrder(targetOrderId, {
        grandTotal,
        method: payMethod.toUpperCase(),
        discount: 0,
        tax: cgst + sgst,
        serviceCharge: serviceCharge
      });
      await updateOrderStatus(targetOrderId, "Paid");
    }

    if (targetTableId) {
      await updateTableStatus(targetTableId, "paid");
    }

    try {
      localStorage.setItem(
        "truffles_last_event",
        JSON.stringify({
          type: "PAYMENT_COMPLETED",
          table_id: targetTableId,
          tableId: targetTableId,
          order_id: targetOrderId,
          timestamp: Date.now()
        })
      );
    } catch {}

    setTimeout(() => {
      setScreen("feedback");
    }, 1500);
  };

  const performCompleteLogout = async (confirmNeeded = false) => {
    if (confirmNeeded) {
      if (!window.confirm("Are you sure you want to disconnect Wi-Fi & log out of Table Session?")) {
        return;
      }
    }

    const activeTableIdOrNum = selectedTable || localStorage.getItem("truffles_active_table") || localStorage.getItem("truffles_guest_table");

    if (activeTableIdOrNum) {
      try {
        await updateTableStatus(activeTableIdOrNum, "needs_cleaning");
      } catch (err) {
        console.error("Failed to update table status on logout:", err);
      }
    }

    // Clear all client session local storage & session storage keys
    try {
      localStorage.removeItem("truffles_guest_table");
      localStorage.removeItem("truffles_customer_session");
      localStorage.removeItem("truffles_active_table");
      localStorage.removeItem("truffles_customer_name");
      localStorage.removeItem("truffles_user_info");
      localStorage.removeItem("truffles_selected_table");
      localStorage.removeItem("truffles_cart");
      sessionStorage.clear();
    } catch (e) {}

    setCart([]);
    setFeedbackSubmitted(false);
    setSelectedTable(null);
    setCustomerName("");
    setCustomerPhone("");
    setTrackedOrder(null);
    setScreen("portal");

    // Cleanly strip URL query parameters (e.g. ?table=8) so browser returns to Image 3 Check-in screen
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.origin + window.location.pathname);
    }

    if (shouldRedirect) {
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  const handleLogoutGuest = () => performCompleteLogout(true);

  return (
    <div className="customer-app-wrapper fade-in">
      {/* SCREEN 1: CAPTIVE PORTAL CHECK-IN */}
      {screen === "portal" && (
        <div className="customer-screen-card portal-splash">
          <div className="splash-content">
            <h1 className="brand-truffles-title" style={{ fontSize: "32px" }}>TRUFFLES</h1>
            <p className="brand-truffles-tagline">FREE HIGH-SPEED WI-FI</p>

            <div className="wifi-hero-icon">
              <Wifi size={48} color="#FF6B35" />
            </div>

            <h2>Wi-Fi Captive Portal Check-in</h2>
            <p className="body-text" style={{ textAlign: "center" }}>
              Enter your details to receive an OTP and connect to <strong>Truffles-Free-WiFi</strong>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customerName || !customerPhone) {
                  alert("Please enter your name and phone number.");
                  return;
                }
                setScreen("otp_verify");
              }}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}
            >
              <div className="form-group" style={{ textAlign: "left" }}>
                <label className="caption-text">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ textAlign: "left" }}>
                <label className="caption-text">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <label className="checkbox-container" style={{ fontSize: "12px", color: "#B0B0C0" }}>
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                />
                <span>I agree to Wi-Fi Terms of Service & Privacy Policy</span>
              </label>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", marginTop: "8px" }}
                disabled={!agreedTerms}
              >
                Send OTP to Connect <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SCREEN 2: ENTER OTP VERIFICATION */}
      {screen === "otp_verify" && (
        <div className="customer-screen-card portal-splash">
          <div className="splash-content">
            <div className="wifi-hero-icon" style={{ background: "rgba(126, 231, 135, 0.15)", border: "1px solid rgba(126, 231, 135, 0.4)" }}>
              <CheckCircle size={44} color="#7EE787" />
            </div>

            <h2>Enter 4-Digit OTP</h2>
            <p className="body-text" style={{ textAlign: "center", fontSize: "13px" }}>
              We sent a 4-digit verification code to <strong>{customerPhone || "+91 98765 43210"}</strong>.
            </p>

            {otpError && <p style={{ color: "#FF4D4D", fontSize: "12px" }}>{otpError}</p>}

            <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value;
                    const next = [...otpDigits];
                    next[idx] = val;
                    setOtpDigits(next);
                  }}
                  style={{
                    width: "48px",
                    height: "54px",
                    textAlign: "center",
                    fontSize: "22px",
                    fontWeight: "bold",
                    borderRadius: "10px",
                    border: "2px solid #FF6B35",
                    background: "#12121E",
                    color: "#FFFFFF"
                  }}
                />
              ))}
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => {
                const code = otpDigits.join("");
                if (code.length < 4) {
                  setOtpError("Please enter complete 4-digit OTP.");
                  return;
                }
                setOtpError("");
                setScreen("table_confirm");
              }}
            >
              Verify OTP & Select Table <ArrowRight size={16} />
            </button>

            <button
              className="btn-secondary"
              style={{ width: "100%", marginTop: "8px", fontSize: "12px" }}
              onClick={() => setScreen("portal")}
            >
              Resend OTP / Change Details
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: TABLE CONFIRM */}
      {screen === "table_confirm" && (
        <div className="customer-screen-card table-confirm-splash">
          <div className="splash-content">
            {/* ── HEADER CONTROL BAR ── */}
            <div style={{
              display: "flex", gap: "10px", width: "100%", marginBottom: "16px"
            }}>
              <button
                onClick={() => { setPreOrderCart([]); setShowPreOrderModal(true); }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "7px", padding: "11px 12px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#fff", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245,158,11,0.35)"
                }}
              >
                <ShoppingBag size={15} /> Pre-Order Food
              </button>
              <button
                onClick={() => { setResSuccess(null); setResError(""); setResTableId(""); setShowReserveModal(true); }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "7px", padding: "11px 12px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  color: "#fff", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)"
                }}
              >
                <CalendarDays size={15} /> Reserve a Table
              </button>
            </div>

            <div className="table-badge-large">
              <span>TABLE</span>
              <strong>{selectedTableNumber}</strong>
            </div>

            <h2>You are at Table {selectedTableNumber} — Koramangala Branch</h2>

            <div className="form-group" style={{ width: "100%", margin: "12px 0", textAlign: "left" }}>
              <label className="caption-text">Select / Change Your Table Number:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.number} ({t.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {existingOrderForTable ? (
              <div className="warning-callout">
                <AlertTriangle size={24} color="#FACC15" />
                <div>
                  <strong>Active Order Exists</strong>
                  <p className="caption-text">
                    This table currently has an active order ({existingOrderForTable.id}). You can view status or append items.
                  </p>
                </div>
              </div>
            ) : (
              <p className="body-text" style={{ textAlign: "center" }}>
                Browse our digital menu, customize your favorite items, and send your order straight to the kitchen display!
              </p>
            )}

            <div className="confirm-actions-group">
              {existingOrderForTable && (
                <button
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setActiveOrderId(existingOrderForTable.id);
                    setScreen("tracking");
                  }}
                >
                  View Active Order ({existingOrderForTable.id})
                </button>
              )}

              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={() => {
                  handleTableCheckIn(selectedTable);
                  setScreen("menu");
                }}
              >
                Browse Digital Menu <ArrowRight size={16} />
              </button>
              
              <button
                onClick={handleLogoutGuest}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  cursor: "pointer",
                  fontWeight: 600,
                  width: "100%",
                  marginTop: "8px"
                }}
              >
                <LogOut size={15} />
                <span>Disconnect Wi-Fi / Change Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: MENU BROWSER */}
      {screen === "menu" && (
        <div className="customer-menu-view fade-in">
          {/* Header */}
          <div className="menu-sticky-header">
            <div>
              <h1 className="brand-truffles-title" style={{ fontSize: "20px" }}>TRUFFLES</h1>
              <span className="caption-text">Table {selectedTableNumber} • Koramangala</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                className="cart-icon-btn"
                onClick={() => setShowCartDrawer(true)}
              >
                <ShoppingBag size={22} color="#FF6B35" />
                {cart.length > 0 && <span className="cart-badge-count">{cart.length}</span>}
              </button>

              <button
                onClick={handleLogoutGuest}
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
          </div>

          {/* Search & Filter Bar */}
          <div className="search-filter-section">
            <div className="search-input-box">
              <Search size={16} color="#666680" />
              <input
                type="text"
                placeholder="Search burgers, pizzas, drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-controls-row">
              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                />
                <span className="dot-veg"></span> Veg Only
              </label>

              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Popularity</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Horizontal Category Scroll */}
            <div className="category-scroll-bar">
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
          </div>

          {/* Items Grid */}
          <div className="menu-items-grid">
            {processedMenuItems.map((dish, idx) => (
              <div key={dish.id} className="dish-item-card" onClick={() => handleOpenCustomization(dish)}>
                <div className="dish-img-box">
                  {/* 90x90 display box — request a 2x-retina 180px asset instead of the stored 800px default. */}
                  <img src={sizedImageUrl(dish.image, 180)} alt={dish.name} loading="lazy" decoding="async" />
                  <span className={`veg-indicator-dot ${dish.isVeg ? "veg" : "nonveg"}`}>
                    <span className="dot-inner"></span>
                  </span>
                  {idx < 2 && <span className="bestseller-badge"><Flame size={10} /> BEST SELLER</span>}
                </div>

                <div className="dish-info-box">
                  <h3 className="dish-name">{dish.name}</h3>
                  <p className="caption-text">{dish.description}</p>
                  <div className="dish-footer-row">
                    <span className="price-mono">₹{dish.price}</span>
                    <button className="btn-secondary add-btn-sm">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Cart Bar */}
          {cart.length > 0 && (
            <div className="floating-cart-bar" onClick={() => setShowCartDrawer(true)}>
              <div>
                <span className="caption-text">{cart.reduce((s, i) => s + i.qty, 0)} ITEMS</span>
                <div className="price-mono" style={{ fontSize: "18px" }}>₹{cartSubtotal}</div>
              </div>
              <button className="btn-primary">
                View Cart <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 4: ITEM DETAIL / CUSTOMIZATION BOTTOM SHEET */}
      {selectedDish && (
        <div className="bottom-sheet-backdrop" onClick={() => setSelectedDish(null)}>
          <div className="bottom-sheet-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn-close sheet-close" onClick={() => setSelectedDish(null)}>
              <X size={20} />
            </button>

            {/* Detail sheet is capped at 480px wide — 700px covers a solid retina render without the full 800px+ original. */}
            <img src={sizedImageUrl(selectedDish.image, 700)} alt={selectedDish.name} className="sheet-image" loading="lazy" decoding="async" />

            <div className="sheet-body">
              <div className="sheet-title-row">
                <h2>{selectedDish.name}</h2>
                <span className="price-mono" style={{ fontSize: "20px" }}>₹{selectedDish.price}</span>
              </div>
              <p className="body-text">{selectedDish.description}</p>

              {/* Addons Customizations Checkboxes */}
              {selectedDish.customizations && selectedDish.customizations.length > 0 && (
                <div className="customizations-section">
                  <label className="caption-text" style={{ fontWeight: 600 }}>CUSTOMIZATIONS & EXTRAS</label>
                  <div className="addons-checkbox-list">
                    {selectedDish.customizations.map((addon) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <label key={addon.id} className={`addon-checkbox-card ${isSelected ? "selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAddonToggle(addon)}
                          />
                          <span className="addon-name">{addon.name}</span>
                          <span className="price-mono" style={{ fontSize: "14px" }}>+₹{addon.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="special-notes-box">
                <label className="caption-text">Special Instructions:</label>
                <textarea
                  placeholder="e.g. Less spicy, extra sauce on side..."
                  rows={2}
                  value={dishNotes}
                  onChange={(e) => setDishNotes(e.target.value)}
                />
              </div>

              {/* Qty & Add to Cart Footer */}
              <div className="sheet-footer-controls">
                <div className="qty-picker">
                  <button onClick={() => setDishQty(Math.max(1, dishQty - 1))}>
                    <Minus size={14} />
                  </button>
                  <span className="price-mono">{dishQty}</span>
                  <button onClick={() => setDishQty(dishQty + 1)}>
                    <Plus size={14} />
                  </button>
                </div>

                <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmAddToCart}>
                  Add to Cart • ₹
                  {(selectedDish.price + selectedAddons.reduce((s, a) => s + a.price, 0)) * dishQty}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 5: CART DRAWER */}
      {showCartDrawer && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowCartDrawer(false)}>
          <div className="bottom-sheet-content cart-drawer-content fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your Order Basket</h2>
              <button className="icon-btn-close" onClick={() => setShowCartDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-body">
              {cart.length === 0 ? (
                <div className="empty-cart-view">
                  <ShoppingBag size={48} color="#666680" />
                  <p className="body-text">Your cart is empty.</p>
                  <button className="btn-primary" onClick={() => setShowCartDrawer(false)}>
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="cart-drawer-item">
                    {/* 50x50 cart thumbnail — 100px covers retina without the 800px original. */}
                    <img src={sizedImageUrl(item.image, 100)} alt={item.name} className="cart-item-thumb" loading="lazy" decoding="async" />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{item.name}</span>
                      {item.addons.length > 0 && (
                        <span className="caption-text">
                          {item.addons.map((a) => a.name).join(", ")}
                        </span>
                      )}
                      <span className="price-mono">₹{item.total}</span>
                    </div>

                    <div className="qty-picker">
                      <button onClick={() => {
                        const updated = cart.map(c => c.cartId === item.cartId ? { ...c, qty: c.qty - 1, total: (c.basePrice + c.addons.reduce((s,a)=>s+a.price,0)) * (c.qty - 1) } : c).filter(c => c.qty > 0);
                        setCart(updated);
                      }}>
                        <Minus size={12} />
                      </button>
                      <span className="price-mono" style={{ fontSize: "13px" }}>{item.qty}</span>
                      <button onClick={() => {
                        const updated = cart.map(c => c.cartId === item.cartId ? { ...c, qty: c.qty + 1, total: (c.basePrice + c.addons.reduce((s,a)=>s+a.price,0)) * (c.qty + 1) } : c);
                        setCart(updated);
                      }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="subtotal-row">
                  <span>Subtotal Amount</span>
                  <span className="timer-stats-mono" style={{ fontSize: "20px" }}>₹{cartSubtotal}</span>
                </div>

                {placeOrderError && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#EF4444",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      marginBottom: "8px"
                    }}
                  >
                    {placeOrderError}
                  </div>
                )}

                <button
                  className="btn-primary"
                  style={{ width: "100%", opacity: isPlacingOrder ? 0.7 : 1 }}
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? "Placing Order..." : "Place Order to Kitchen"} <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 6: ORDER TRACKING */}
      {screen === "tracking" && trackedOrder && (
        <div className="customer-screen-card order-tracking-view fade-in">
          <div className="tracking-header">
            <h2>Order Status</h2>
            <span className="badge-tag active">{trackedOrder.id} • Table {trackedOrder.tableId}</span>
          </div>

          {/* Vertical Progress Bar */}
          <div className="status-progress-vertical">
            {[
              { stage: "New", label: "Confirmed", icon: CheckCircle },
              { stage: "In Kitchen", label: "Preparing in Kitchen", icon: ChefHat },
              { stage: "Ready", label: "Ready for Pickup", icon: Bell },
              { stage: "Served", label: "Served to Table", icon: Hand }
            ].map((st, idx) => {
              const stagesOrder = ["New", "In Kitchen", "Ready", "Served", "Payment Pending", "Paid"];
              const currentIdx = stagesOrder.indexOf(trackedOrder.status);
              const stepIdx = stagesOrder.indexOf(st.stage);

              const isDone = currentIdx > stepIdx;
              const isCurrent = currentIdx === stepIdx;

              const IconComp = st.icon;

              return (
                <div key={st.stage} className={`progress-step-row ${isCurrent ? "current" : isDone ? "done" : "pending"}`}>
                  <div className="step-icon-circle">
                    <IconComp size={18} />
                  </div>
                  <div className="step-info">
                    <span className="step-label">{st.label}</span>
                    <span className="caption-text">
                      {isCurrent ? "In progress..." : isDone ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tracked-items-summary">
            <span className="caption-text">ORDER SUMMARY</span>
            {trackedOrder.items.map((i, idx) => (
              <div key={idx} className="summary-item-line">
                <span>{i.qty}x {i.name}</span>
                <span className="price-mono">₹{i.price * i.qty}</span>
              </div>
            ))}
          </div>

          <div className="tracking-actions-row">
            <button className="btn-secondary" onClick={() => setScreen("menu")}>
              + Order More Items
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                const activeTabId = selectedTable || trackedOrder?.tableId;
                if (activeTabId) {
                  await updateTableStatus(activeTabId, "awaiting_payment");
                }
                setScreen("bill_pay");
              }}
            >
              Proceed to Bill & Pay <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 7: BILL & PAY */}
      {screen === "bill_pay" && trackedOrder && (
        <div className="customer-screen-card bill-pay-view fade-in">
          <h2>Your Final Bill</h2>
          <span className="caption-text">Table {selectedTableNumber} • Order {trackedOrder.id}</span>

          <div className="bill-items-list">
            {trackedOrder.items.map((item, idx) => (
              <div key={idx} className="bill-item-row">
                <span>{item.qty}x {item.name}</span>
                <span className="price-mono">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="bill-taxes-box">
            <div className="calc-row"><span>Subtotal</span><span>₹{orderSubtotal}</span></div>
            <div className="calc-row"><span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span></div>
            <div className="calc-row"><span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span></div>
            <div className="calc-row"><span>Service Charge (5%)</span><span>₹{serviceCharge.toFixed(2)}</span></div>
            <div className="calc-row grand-total"><span>Grand Total</span><span className="timer-stats-mono" style={{ fontSize: "22px" }}>₹{grandTotal}</span></div>
          </div>

          {/* Split Bill Toggle */}
          <div className="split-bill-section">
            <label className="checkbox-container">
              <input type="checkbox" checked={isSplitBill} onChange={(e) => setIsSplitBill(e.target.checked)} />
              <span>Split Bill Among Guests</span>
            </label>

            {isSplitBill && (
              <div className="split-controls">
                <span>Guests Count:</span>
                <div className="qty-picker">
                  <button onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}>-</button>
                  <span className="price-mono">{splitPeople}</span>
                  <button onClick={() => setSplitPeople(splitPeople + 1)}>+</button>
                </div>
                <span className="timer-stats-mono" style={{ fontSize: "16px" }}>₹{perPersonAmount}/person</span>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="payment-options-grid">
            <button className={`pay-opt ${payMethod === "upi" ? "active" : ""}`} onClick={() => setPayMethod("upi")}>
              <QrCode size={20} /> UPI QR
            </button>
            <button className={`pay-opt ${payMethod === "card" ? "active" : ""}`} onClick={() => setPayMethod("card")}>
              <CreditCard size={20} /> Card
            </button>
            <button className={`pay-opt ${payMethod === "cash" ? "active" : ""}`} onClick={() => setPayMethod("cash")}>
              <Banknote size={20} /> Cash
            </button>
          </div>

          {paymentSuccess ? (
            <div className="success-banner">
              <CheckCircle size={32} color="#7EE787" />
              <strong style={{ color: "#7EE787" }}>Payment Confirmed! Thank you for dining with Truffles!</strong>
            </div>
          ) : (
            <button className="btn-primary" style={{ width: "100%", marginTop: "12px" }} onClick={handlePaySuccess}>
              Pay ₹{isSplitBill ? perPersonAmount : grandTotal} Now
            </button>
          )}
        </div>
      )}

      {/* SCREEN 8: FEEDBACK */}
      {screen === "feedback" && (
        <div className="customer-screen-card feedback-view fade-in">
          <div className="feedback-content">
            <h2>How was your experience?</h2>
            <p className="caption-text">Your feedback helps us make Truffles better everyday!</p>

            {/* 5 Star Rating Selector */}
            <div className="star-rating-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${rating >= star ? "filled" : ""}`}
                  onClick={() => setRating(star)}
                >
                  <Star size={28} fill={rating >= star ? "#FF6B35" : "none"} color={rating >= star ? "#FF6B35" : "#666680"} />
                </button>
              ))}
            </div>

            <div className="form-group" style={{ width: "100%" }}>
              <label className="caption-text">Comments & Suggestions:</label>
              <textarea
                rows={3}
                placeholder="Tell us what you loved or how we can improve..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>

            <button className="btn-secondary" style={{ width: "100%" }}>
              <Camera size={16} /> Add a Photo (Optional)
            </button>

            {feedbackSubmitted ? (
              <div className="success-banner" style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "center", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <CheckCircle size={24} color="#7EE787" />
                  <span style={{ color: "#7EE787", fontWeight: 800, fontSize: "16px" }}>Thank You for Your Feedback!</span>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: "100%", background: "#234A3B", color: "#ffffff", fontWeight: 800, padding: "14px", borderRadius: "14px", border: "none", cursor: "pointer" }}
                  onClick={() => performCompleteLogout(true)}
                >
                  ✨ Exit Feedback Page
                </button>
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ width: "100%", marginTop: "12px" }}
                onClick={async () => {
                  setFeedbackSubmitted(true);
                  await submitCustomerFeedback({
                    orderId: trackedOrder?.id,
                    rating,
                    comment: feedbackComment
                  });
                }}
              >
                Submit Feedback
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* ========================================
           RESERVE TABLE MODAL
      ======================================== */}
      {showReserveModal && (
        <div
          onClick={() => { if (!resLoading) setShowReserveModal(false); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1A1A2E", borderRadius: "20px",
              padding: "24px 20px 32px", width: "100%", maxWidth: "480px",
              maxHeight: "85vh", overflowY: "auto"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarDays size={18} color="#818CF8" /> Reserve a Table
              </h3>
              <button onClick={() => setShowReserveModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={20} />
              </button>
            </div>

            {resSuccess ? (
              /* Success State */
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ color: "#7EE787", margin: "0 0 8px" }}>Reservation Confirmed!</h3>
                <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 20px" }}>
                  Table {tables.find(t => t.id === resTableId)?.number} reserved for {resGuests} guests<br />
                  on {new Date(`${resDate}T${resTime}`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: "20px" }}>
                  <p style={{ color: "#A5B4FC", fontSize: "12px", margin: 0 }}>Reservation for {customerName || "Guest"} • Your table will be ready at the reserved time.</p>
                </div>
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowReserveModal(false)}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Date Picker */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Date</label>
                  <input
                    type="date"
                    value={resDate}
                    min={new Date().toISOString().split("T")[0]}
                    max={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                    onChange={(e) => setResDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #374151", background: "#111827", color: "#fff", fontSize: "14px" }}
                  />
                </div>

                {/* Time Slot Picker */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    Time Slot (90-min block)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setResTime(slot)}
                        style={{
                          padding: "8px 4px", borderRadius: "8px", border: "1px solid",
                          borderColor: resTime === slot ? "#6366F1" : "#374151",
                          background: resTime === slot ? "rgba(99,102,241,0.2)" : "#111827",
                          color: resTime === slot ? "#A5B4FC" : "#9CA3AF",
                          fontSize: "11px", fontWeight: 600, cursor: "pointer"
                        }}
                      >{slot}</button>
                    ))}
                  </div>
                </div>

                {/* Guest Count */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Number of Guests</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button onClick={() => setResGuests(Math.max(1, resGuests - 1))} className="btn-secondary" style={{ padding: "8px 16px" }}>−</button>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px", minWidth: "40px", textAlign: "center" }}>{resGuests}</span>
                    <button onClick={() => setResGuests(Math.min(12, resGuests + 1))} className="btn-secondary" style={{ padding: "8px 16px" }}>+</button>
                    <span style={{ color: "#6B7280", fontSize: "13px" }}>guests</span>
                  </div>
                </div>

                {/* Table Availability Grid */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "#9CA3AF", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Select Table
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {tables.map((t) => {
                      const isOccupied = t.status === "occupied" || t.status === "awaiting_payment";
                      const isAlreadyReserved = resAvailability[t.id] === false || t.status === "reserved";
                      const isDisabled = isOccupied || isAlreadyReserved;
                      const isSelected = resTableId === t.id;
                      return (
                        <button
                          key={t.id}
                          disabled={isDisabled}
                          onClick={() => { setResTableId(t.id); setResError(""); }}
                          title={isOccupied ? "Currently occupied" : isAlreadyReserved ? "Already reserved" : "Available"}
                          style={{
                            padding: "12px 6px", borderRadius: "10px", border: "2px solid",
                            borderColor: isSelected ? "#6366F1" : isDisabled ? "#1F2937" : "#374151",
                            background: isSelected ? "rgba(99,102,241,0.2)" : isDisabled ? "#0F172A" : "#1F2937",
                            color: isSelected ? "#A5B4FC" : isDisabled ? "#4B5563" : "#D1D5DB",
                            fontWeight: 700, fontSize: "12px", cursor: isDisabled ? "not-allowed" : "pointer",
                            opacity: isDisabled ? 0.5 : 1
                          }}
                        >
                          T{t.number || t.table_number}
                          {isDisabled && <div style={{ fontSize: "9px", fontWeight: 400, marginTop: "2px", color: "#6B7280" }}>{isOccupied ? "Busy" : "Reserved"}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {resError && (
                  <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={14} /> {resError}
                  </p>
                )}

                <button
                  className="btn-primary"
                  style={{ width: "100%" }}
                  disabled={resLoading || !resTableId}
                  onClick={handleSubmitReservation}
                >
                  {resLoading ? "Confirming..." : `Confirm Reservation for ${resGuests} guests`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================
           PRE-ORDER FOOD MODAL
      ======================================== */}
      {showPreOrderModal && (
        <div
          onClick={() => setShowPreOrderModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1A1A2E", borderRadius: "20px 20px 0 0",
              width: "100%", maxWidth: "480px", maxHeight: "92vh",
              display: "flex", flexDirection: "column"
            }}
          >
            {/* Pre-Order Header */}
            <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={18} color="#FBBF24" /> Pre-Order Food
                </h3>
                <button onClick={() => setShowPreOrderModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ color: "#6B7280", fontSize: "12px", margin: "0 0 12px" }}>
                Order ahead — we'll send you to the kitchen as soon as a table is free!
              </p>
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "#111827", border: "1px solid #374151", marginBottom: "10px" }}>
                <Search size={14} color="#6B7280" />
                <input
                  type="text" placeholder="Search menu..."
                  value={preOrderSearch}
                  onChange={(e) => setPreOrderSearch(e.target.value)}
                  style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: "13px", width: "100%" }}
                />
              </div>
              {/* Category Scroll */}
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px" }}>
                <button
                  onClick={() => setPreOrderCategory("all")}
                  style={{
                    padding: "5px 14px", borderRadius: "20px", border: "none", whiteSpace: "nowrap",
                    background: preOrderCategory === "all" ? "#FF6B35" : "#1F2937",
                    color: preOrderCategory === "all" ? "#fff" : "#9CA3AF",
                    fontWeight: 600, fontSize: "12px", cursor: "pointer"
                  }}
                >All</button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPreOrderCategory(c.id)}
                    style={{
                      padding: "5px 14px", borderRadius: "20px", border: "none", whiteSpace: "nowrap",
                      background: preOrderCategory === c.id ? "#FF6B35" : "#1F2937",
                      color: preOrderCategory === c.id ? "#fff" : "#9CA3AF",
                      fontWeight: 600, fontSize: "12px", cursor: "pointer"
                    }}
                  >{c.name}</button>
                ))}
              </div>
            </div>

            {/* Menu Scroll Area */}
            <div style={{ overflowY: "auto", flex: 1, padding: "0 20px" }}>
              {preOrderMenuItems.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => { setPreOrderDish(dish); setPreOrderDishQty(1); setPreOrderAddons([]); }}
                  style={{
                    display: "flex", gap: "12px", alignItems: "center",
                    padding: "12px 0", borderBottom: "1px solid #1F2937", cursor: "pointer"
                  }}
                >
                  {/* 56x56 inline thumbnail in the pre-order list — 112px covers retina. */}
                  {dish.image && <img src={sizedImageUrl(dish.image, 112)} alt={dish.name} loading="lazy" decoding="async" style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", color: "#F9FAFB", fontWeight: 600, fontSize: "14px" }}>{dish.name}</p>
                    <p style={{ margin: "0 0 4px", color: "#6B7280", fontSize: "12px" }}>{dish.description}</p>
                    <span style={{ color: "#FF6B35", fontWeight: 700, fontSize: "14px" }}>₹{dish.price}</span>
                  </div>
                  <button style={{ padding: "6px 14px", borderRadius: "8px", background: "#FF6B35", color: "#fff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                    + Add
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Summary + Submit */}
            {preOrderCart.length > 0 && (
              <div style={{ padding: "16px 20px", borderTop: "1px solid #1F2937", flexShrink: 0 }}>
                <div style={{ marginBottom: "10px" }}>
                  {preOrderCart.map((item) => (
                    <div key={item.cartId} style={{ display: "flex", justifyContent: "space-between", color: "#D1D5DB", fontSize: "13px", marginBottom: "4px" }}>
                      <span>{item.qty}× {item.name}</span>
                      <span>₹{item.total}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontWeight: 700, borderTop: "1px solid #374151", paddingTop: "8px", marginTop: "8px" }}>
                    <span>Total</span><span>₹{preOrderSubtotal}</span>
                  </div>
                </div>
                <button
                  className="btn-primary" style={{ width: "100%" }}
                  disabled={preOrderSubmitting}
                  onClick={handleSubmitPreOrder}
                >
                  {preOrderSubmitting ? "Placing Pre-Order..." : `Place Pre-Order (₹${preOrderSubtotal}) →`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pre-Order Item Customization Sheet */}
      {preOrderDish && (
        <div
          onClick={() => setPreOrderDish(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 3000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1A1A2E", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: "480px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#fff", fontWeight: 700 }}>{preOrderDish.name}</h3>
              <button onClick={() => setPreOrderDish(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={18} /></button>
            </div>
            {preOrderDish.customizations?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "8px" }}>ADD-ONS</p>
                {preOrderDish.customizations.map((addon) => {
                  const isSelected = preOrderAddons.some((a) => a.id === addon.id);
                  return (
                    <label key={addon.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", cursor: "pointer", marginBottom: "4px", background: isSelected ? "rgba(255,107,53,0.15)" : "transparent" }}>
                      <input type="checkbox" checked={isSelected} onChange={() => setPreOrderAddons(isSelected ? preOrderAddons.filter((a) => a.id !== addon.id) : [...preOrderAddons, addon])} />
                      <span style={{ color: "#D1D5DB", fontSize: "14px" }}>{addon.name}</span>
                      <span style={{ marginLeft: "auto", color: "#FF6B35", fontSize: "13px" }}>+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <button onClick={() => setPreOrderDishQty(Math.max(1, preOrderDishQty - 1))} className="btn-secondary" style={{ padding: "8px 16px" }}>−</button>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>{preOrderDishQty}</span>
              <button onClick={() => setPreOrderDishQty(preOrderDishQty + 1)} className="btn-secondary" style={{ padding: "8px 16px" }}>+</button>
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={handleAddToPreOrderCart}>
              Add ₹{(preOrderDish.price + preOrderAddons.reduce((s, a) => s + a.price, 0)) * preOrderDishQty} to Pre-Order
            </button>
          </div>
        </div>
      )}

      {/* SCREEN: PRE-ORDER SUCCESS */}
      {screen === "preorder_success" && (
        <div className="customer-screen-card portal-splash fade-in">
          <div className="splash-content" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "8px" }}>🎟️</div>
            <h2 style={{ color: "#7EE787", marginBottom: "8px" }}>Pre-Order Placed!</h2>
            <p className="body-text" style={{ marginBottom: "20px" }}>Your order is queued. We'll seat you as soon as a table is available!</p>
            <div style={{
              padding: "20px", borderRadius: "14px",
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              marginBottom: "24px"
            }}>
              <p style={{ color: "#9CA3AF", fontSize: "12px", margin: "0 0 6px" }}>YOUR TICKET NUMBER</p>
              <p style={{ color: "#FBBF24", fontSize: "32px", fontWeight: 900, fontFamily: "monospace", margin: 0 }}>{preOrderTicket}</p>
              <p style={{ color: "#6B7280", fontSize: "12px", margin: "8px 0 0" }}>Show this to our staff when you're called</p>
            </div>
            <p style={{ color: "#6B7280", fontSize: "13px", marginBottom: "20px" }}>
              Our team will notify you when Table is ready. Average wait: 15–20 min.
            </p>
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setScreen("table_confirm")}>
                Back to Check-In
              </button>
              <button className="btn-primary" style={{ flex: 1, background: "#10B981" }} onClick={() => setScreen("bill_pay")}>
                Pay Bill Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

