import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  INITIAL_BRANCHES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_ACTIVE_ORDERS,
  INITIAL_PAID_TRANSACTIONS
} from "../data/initialData";
import {
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  fetchRestaurantTables,
  upsertRestaurantTable,
  updateRestaurantTableStatus,
  fetchOrders,
  createOrderInDb,
  updateOrderStatusInDb,
  payOrderInDb,
  createFeedbackInDb,
  subscribeToRealtimeChanges
} from "../lib/supabase";

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ""));

const RestoContext = createContext(null);

export const RestoProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState(INITIAL_BRANCHES[0]);
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      return localStorage.getItem("truffles_current_role") || "Waiter";
    } catch (e) {
      return "Waiter";
    }
  });

  const [activeWaiter, setActiveWaiter] = useState(() => {
    try {
      return localStorage.getItem("truffles_active_waiter") || null;
    } catch (e) {
      return null;
    }
  });

  const handleSetActiveWaiter = (waiterName) => {
    setActiveWaiter(waiterName);
    try {
      if (waiterName) {
        localStorage.setItem("truffles_active_waiter", waiterName);
      } else {
        localStorage.removeItem("truffles_active_waiter");
      }
    } catch (e) {}
  };

  const handleSetCurrentRole = (role) => {
    setCurrentRole(role);
    try {
      localStorage.setItem("truffles_current_role", role);
    } catch (e) {}
  };

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) return tabParam;

      const host = window.location.hostname.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      if (host.includes("captive-portal") || pathname.includes("/portal")) return "captive_portal";
      if (host.includes("kds-dashboard") || pathname.includes("/kds")) return "kds";
      if (host.includes("pos-dashboard")) return "table_map";

      const port = window.location.port;
      if (port === "3000") return "customer_app";
      if (port === "3001") return "table_map";
      if (port === "3002") return "kds";

      return "table_map";
    } catch (e) {
      return "table_map";
    }
  });

  // Sync activeTab to URL search params on change
  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url);
    } catch (e) {}
  };
  const [selectedTableForBilling, setSelectedTableForBilling] = useState(null);

  const [tables, setTables] = useState(INITIAL_TABLES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [activeOrders, setActiveOrders] = useState(INITIAL_ACTIVE_ORDERS);
  const [paidTransactions, setPaidTransactions] = useState(INITIAL_PAID_TRANSACTIONS);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Track last processed event timestamp
  const lastProcessedTs = useRef(0);

  // Helper to safely resolve a table from tables array without running digit stripping on UUIDs
  const resolveTable = useCallback((tableId, tablesList = tables) => {
    if (!tableId || !Array.isArray(tablesList) || tablesList.length === 0) return null;
    const strId = String(tableId).trim();

    // 1. Direct match on table.id (e.g. Postgres UUID or exact "T5")
    const directMatch = tablesList.find((t) => String(t.id) === strId);
    if (directMatch) return directMatch;

    // 2. Parse table number safely ONLY if strId is NOT a UUID
    const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strId);
    if (!isUUIDFormat) {
      let num = NaN;
      if (typeof tableId === "number") {
        num = tableId;
      } else {
        const clean = strId.toUpperCase().replace(/^T/, "");
        num = parseInt(clean, 10);
      }

      if (!isNaN(num)) {
        const numMatch = tablesList.find((t) => t.number === num);
        if (numMatch) return numMatch;
      }
    }

    return null;
  }, [tables]);

  // Helper to map DB categories to frontend format
  const mapDbCategory = (dbCat) => ({
    id: dbCat.id,
    name: dbCat.category_name || dbCat.name,
    icon: "Utensils",
    sortOrder: 1
  });

  // Helper to map DB menu items to frontend format
  const mapDbMenuItem = (dbItem) => ({
    id: dbItem.id,
    categoryId: dbItem.category_id,
    name: dbItem.item_name || dbItem.name,
    description: dbItem.description || "",
    price: parseFloat(dbItem.price) || 0,
    isVeg: dbItem.veg !== undefined ? dbItem.veg : true,
    isAvailable: dbItem.available !== undefined ? dbItem.available : true,
    prepTime: 15,
    image: dbItem.image_url || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    customizations: []
  });

  // Helper to map DB orders to frontend format
  const mapDbOrder = (dbOrder) => {
    const items = (dbOrder.order_items || []).map((i) => {
      const foundMenuItem = menuItems.find((m) => String(m.id) === String(i.menu_item_id));
      const dishName = i.menu_items?.item_name || i.menu_items?.name || foundMenuItem?.name || "Delicious Item";

      return {
        id: i.id,
        menuItemId: i.menu_item_id,
        name: dishName,
        price: parseFloat(i.price) || 0,
        qty: parseInt(i.quantity, 10) || 1,
        customizations: i.notes ? [i.notes] : []
      };
    });

    const foundTable = resolveTable(dbOrder.table_id, tables);
    const displayTableId = foundTable ? `T${foundTable.number}` : dbOrder.table_id || "T1";

    const custName = dbOrder.customer_name || dbOrder.customerName || "Guest";
    const custPhone = dbOrder.customer_phone || dbOrder.customerPhone || "";

    return {
      id: dbOrder.id,
      tableId: displayTableId,
      table_id: dbOrder.table_id || displayTableId,
      customerName: custName,
      customerPhone: custPhone,
      customer_name: custName,
      customer_phone: custPhone,
      status: dbOrder.order_status || "New",
      order_status: dbOrder.order_status || "New",
      payment_status: dbOrder.payment_status || "Pending",
      createdAt: dbOrder.created_at || new Date().toISOString(),
      created_at: dbOrder.created_at || new Date().toISOString(),
      priority: "normal",
      items,
      order_items: dbOrder.order_items || [],
      notes: "",
      totalAmount: parseFloat(dbOrder.total) || 0,
      total: parseFloat(dbOrder.total) || 0,
      discount: parseFloat(dbOrder.discount) || 0,
      tax: parseFloat(dbOrder.tax) || 0
    };
  };

  // Helper to map DB tables to frontend format
  const mapDbTable = (dbTable) => ({
    id: dbTable.id || `T${dbTable.table_number}`,
    number: parseInt(dbTable.table_number, 10) || 1,
    status: dbTable.status || "vacant",
    guests: dbTable.status === "occupied" ? 2 : 0,
    seatedTime: null,
    orderId: null,
    activeOrderTotal: 0,
    customerName: null,
    customerPhone: null
  });

  // Load initial data from Supabase
  const loadSupabaseData = useCallback(async () => {
    try {
      // 1. Categories
      const dbCategories = await fetchMenuCategories();
      if (dbCategories && dbCategories.length > 0) {
        setCategories(dbCategories.map(mapDbCategory));
      } else {
        for (const cat of INITIAL_CATEGORIES) {
          await createMenuCategory(cat.name);
        }
        const fresh = await fetchMenuCategories();
        if (fresh?.length > 0) setCategories(fresh.map(mapDbCategory));
      }

      // 2. Menu Items
      const dbItems = await fetchMenuItems();
      if (dbItems && dbItems.length > 0) {
        setMenuItems(dbItems.map(mapDbMenuItem));
      } else {
        for (const item of INITIAL_MENU_ITEMS) {
          await createMenuItem(item);
        }
        const fresh = await fetchMenuItems();
        if (fresh?.length > 0) setMenuItems(fresh.map(mapDbMenuItem));
      }

      // 3. Restaurant Tables from Supabase (SINGLE SOURCE OF TRUTH)
      const dbTables = await fetchRestaurantTables();
      let loadedTables = INITIAL_TABLES;
      if (dbTables && dbTables.length > 0) {
        loadedTables = dbTables.map(mapDbTable).sort((a, b) => a.number - b.number);
      } else {
        for (const tbl of INITIAL_TABLES) {
          await upsertRestaurantTable(tbl);
        }
        const fresh = await fetchRestaurantTables();
        if (fresh?.length > 0) {
          loadedTables = fresh.map(mapDbTable).sort((a, b) => a.number - b.number);
        }
      }

      // 4. Orders from Supabase
      const dbOrders = await fetchOrders();
      const allDbOrders = (dbOrders || []).map((o) => ({
        ...mapDbOrder(o),
        paymentStatus: o.payment_status,
        rawTableId: o.table_id
      }));

      const activeList = allDbOrders.filter(
        (o) => o.status !== "Completed" && o.status !== "Cancelled" && o.paymentStatus !== "Paid"
      );

      setActiveOrders(activeList);

      // 5. Inspect every table with status = 'needs_cleaning' for persistent timestamp-based auto-vacant transition
      let cleaningTimestamps = {};
      try {
        cleaningTimestamps = JSON.parse(localStorage.getItem("truffles_table_cleaning_timestamps") || "{}");
      } catch {}

      for (const t of loadedTables) {
        if (t.status === "needs_cleaning") {
          const cleanedAtMs = cleaningTimestamps[t.id] || Date.now();
          const elapsedMs = Date.now() - cleanedAtMs;

          if (elapsedMs >= 20000) {
            console.log(`[Timestamp Cleaning Lifecycle] Table #${t.number} in needs_cleaning for ${Math.round(elapsedMs / 1000)}s (>= 20s). Setting status to 'vacant' in Supabase.`);
            if (isUUID(t.id)) {
              await updateRestaurantTableStatus(t.id, "vacant");
            }
            t.status = "vacant";
            t.guests = 0;
            t.seatedTime = null;
            t.orderId = null;
            t.activeOrderTotal = 0;
            t.customerName = null;
            t.customerPhone = null;
            delete cleaningTimestamps[t.id];
          } else {
            const remainingMs = Math.max(100, 20000 - elapsedMs);
            console.log(`[Timestamp Cleaning Lifecycle] Table #${t.number} in needs_cleaning for ${Math.round(elapsedMs / 1000)}s. Scheduling timer for remaining ${Math.round(remainingMs / 1000)}s.`);

            if (!cleaningTimers.current.has(t.id)) {
              const timerId = setTimeout(async () => {
                console.log(`[Timestamp Timer Expired] Remaining time elapsed for Table #${t.number}. Transitioning status to 'vacant'.`);
                if (isUUID(t.id)) {
                  await updateRestaurantTableStatus(t.id, "vacant");
                }
                setTables((prev) =>
                  prev.map((item) =>
                    item.id === t.id
                      ? {
                          ...item,
                          status: "vacant",
                          guests: 0,
                          seatedTime: null,
                          orderId: null,
                          activeOrderTotal: 0,
                          customerName: null,
                          customerPhone: null
                        }
                      : item
                  )
                );
                cleaningTimers.current.delete(t.id);
                try {
                  const tsObj = JSON.parse(localStorage.getItem("truffles_table_cleaning_timestamps") || "{}");
                  delete tsObj[t.id];
                  localStorage.setItem("truffles_table_cleaning_timestamps", JSON.stringify(tsObj));
                } catch {}
                loadSupabaseData();
              }, remainingMs);

              cleaningTimers.current.set(t.id, timerId);
            }
          }
        }
      }

      try {
        localStorage.setItem("truffles_table_cleaning_timestamps", JSON.stringify(cleaningTimestamps));
      } catch {}

      // 6. Merge ONLY live/active orders into table objects
      const synchronizedTables = loadedTables.map((t) => {
        // Find live active (non-completed, non-cancelled) order for this table
        const matchingOrder = allDbOrders.find((o) => {
          if (o.order_status === "Completed" || o.order_status === "Cancelled") return false;
          
          if (o.table_number && parseInt(String(o.table_number), 10) === t.number) return true;
          if (o.rawTableId && String(o.rawTableId) === String(t.id)) return true;
          if (o.tableId === `T${t.number}` || o.tableId === String(t.number) || o.tableId === t.id) return true;
          
          const parsedNum = parseInt(String(o.tableId || o.rawTableId || "").replace(/\D/g, ""), 10);
          return !isNaN(parsedNum) && parsedNum === t.number;
        });

        if (matchingOrder) {
          const itemsSum = (matchingOrder.items || matchingOrder.order_items || []).reduce(
            (s, i) => s + ((parseFloat(i.price) || 0) * (parseInt(i.qty || i.quantity, 10) || 1)),
            0
          );
          const orderTotalRaw = parseFloat(matchingOrder.total || matchingOrder.totalAmount || matchingOrder.total_price) || 0;
          const computedTotal = orderTotalRaw > 0 ? orderTotalRaw : itemsSum;

          return {
            ...t,
            status: t.status === "needs_cleaning" ? "needs_cleaning" : (t.status === "awaiting_payment" ? "awaiting_payment" : "occupied"),
            orderId: matchingOrder.id,
            activeOrderTotal: computedTotal > 0 ? computedTotal : (parseFloat(t.activeOrderTotal) || 0),
            customerName: matchingOrder.customerName || matchingOrder.customer_name || t.customerName || "Customer",
            customerPhone: matchingOrder.customerPhone || matchingOrder.customer_phone || t.customerPhone || "",
            isPaid: matchingOrder.paymentStatus === "Paid" || matchingOrder.payment_status === "Paid" || t.status === "awaiting_payment"
          };
        }

        // If table status in Supabase DB is vacant or needs_cleaning, clear active order data
        return {
          ...t,
          orderId: null,
          activeOrderTotal: 0,
          customerName: null,
          customerPhone: null,
          isPaid: false
        };
      });

      setTables(synchronizedTables);

      // Audit Log: Verify Supabase occupied tables vs React occupied tables
      const supabaseOccupied = dbTables ? dbTables.filter((t) => t.status === "occupied").map((t) => t.table_number) : [];
      const reactOccupied = synchronizedTables.filter((t) => t.status === "occupied").map((t) => t.number);

      console.log(`[Single Source of Truth Audit] Supabase Occupied Tables:`, supabaseOccupied);
      console.log(`[Single Source of Truth Audit] React Occupied Tables:`, reactOccupied);

      setIsDbLoaded(true);
    } catch (err) {
      console.error("[RestoContext] Error loading Supabase data:", err);
    }
  }, []);

  // Reusable 20-second cleaning lifecycle manager per table
  const cleaningTimers = useRef(new Map());

  const markTableNeedsCleaningAndStartTimer = useCallback(async (tableId) => {
    const foundTable = resolveTable(tableId, tables);
    const targetId = foundTable ? foundTable.id : tableId;
    const tableNum = foundTable ? foundTable.number : tableId;

    if (!targetId) return;

    // Prevent duplicate timers if table is already in needs_cleaning state
    if (cleaningTimers.current.has(targetId)) {
      console.log(`[Logout Warning] Table #${tableNum} is ALREADY in needs_cleaning state with an active 20s timer.`);
      return;
    }

    console.log(`[6] updateRestaurantTableStatus called for tableId: ${targetId} (Table #${tableNum})`);
    console.log(`[7] Executing Supabase UPDATE: restaurant_tables.status = 'needs_cleaning'`);

    // Step 1: Complete active order in database
    const activeOrderForTable = activeOrders.find(
      (o) => (o.tableId === targetId || o.tableId === `T${tableNum}`) && o.status !== "Cancelled" && o.status !== "Completed"
    );

    if (activeOrderForTable && isUUID(activeOrderForTable.id)) {
      console.log(`[Logout] Completing active order ${activeOrderForTable.id} for Table #${tableNum} in database...`);
      try {
        await updateOrderStatusInDb(activeOrderForTable.id, "Completed");
      } catch (err) {
        console.error(`[Logout Error] Failed to complete active order ${activeOrderForTable.id}:`, err);
      }
    }

    // Step 2: Immediately update Supabase DB & React state to 'needs_cleaning'
    await updateRestaurantTableStatus(targetId, "needs_cleaning");

    setTables((prev) =>
      prev.map((t) => (t.id === targetId || t.number === tableNum ? { ...t, status: "needs_cleaning" } : t))
    );

    console.log(`[9] Status changed to needs_cleaning for Table #${tableNum}`);
    console.log(`[10] Timer started (20 seconds)`);

    // Persist timestamp for reload resilience
    try {
      const tsObj = JSON.parse(localStorage.getItem("truffles_table_cleaning_timestamps") || "{}");
      tsObj[targetId] = Date.now();
      localStorage.setItem("truffles_table_cleaning_timestamps", JSON.stringify(tsObj));
    } catch {}

    // Broadcast Realtime Event to update POS, Kitchen, Billing, Table Map, Captive Portal
    try {
      localStorage.setItem(
        "truffles_last_event",
        JSON.stringify({ type: "TABLE_STATUS_UPDATE", tableId: targetId, status: "needs_cleaning", timestamp: Date.now() })
      );
    } catch {}

    // Step 3: Start exactly 20-second timer (20,000 ms)
    const timerId = setTimeout(async () => {
      console.log(`[11] Timer expired for Table #${tableNum} (UUID: ${targetId})`);
      console.log(`[12] Updating status to vacant & clearing customer session data...`);

      // Clear customer data, active order reference, and set status to 'vacant'
      await updateRestaurantTableStatus(targetId, "vacant");

      setTables((prev) =>
        prev.map((t) => {
          if (t.id === targetId || t.number === tableNum) {
            return {
              ...t,
              status: "vacant",
              guests: 0,
              seatedTime: null,
              orderId: null,
              activeOrderTotal: 0,
              customerName: null,
              customerPhone: null
            };
          }
          return t;
        })
      );

      // Clean up timer reference
      cleaningTimers.current.delete(targetId);

      // Broadcast Realtime Event for vacant transition
      try {
        localStorage.setItem(
          "truffles_last_event",
          JSON.stringify({ type: "TABLE_STATUS_UPDATE", tableId: targetId, status: "vacant", timestamp: Date.now() })
        );
      } catch {}

      // Reload Supabase state for complete synchronization
      await loadSupabaseData();
    }, 20000);

    cleaningTimers.current.set(targetId, timerId);
  }, [resolveTable, tables, activeOrders, loadSupabaseData]);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Subscribe to Supabase Realtime WSS changes across all tables
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges((table, payload) => {
      console.log(`[Realtime WSS Sync] ${table}:`, payload);
      if (table === "restaurant_tables" && payload?.new?.status === "needs_cleaning") {
        markTableNeedsCleaningAndStartTimer(payload.new.id);
      }
      loadSupabaseData();
    });
    return () => unsubscribe();
  }, [loadSupabaseData, markTableNeedsCleaningAndStartTimer]);

  // Mobile Reconnection Lifecycle (visibilitychange + focus + online) & 5-Second HTTP Polling Fallback
  useEffect(() => {
    const handleMobileWakeup = () => {
      if (document.visibilityState === "visible") {
        console.log("[Mobile Lifecycle] Screen wake / Tab focus restored. Re-syncing database & real-time socket...");
        loadSupabaseData();
      }
    };

    document.addEventListener("visibilitychange", handleMobileWakeup);
    window.addEventListener("focus", handleMobileWakeup);
    window.addEventListener("online", handleMobileWakeup);

    // Requirement 4: 5-Second HTTP Polling Fallback + Realtime Sync for Dashboard
    const pollInterval = setInterval(() => {
      loadSupabaseData();
    }, 5000);

    return () => {
      document.removeEventListener("visibilitychange", handleMobileWakeup);
      window.removeEventListener("focus", handleMobileWakeup);
      window.removeEventListener("online", handleMobileWakeup);
      clearInterval(pollInterval);
    };
  }, [loadSupabaseData]);

  // Process incoming cross-port events from Captive Portal via localStorage
  const processEvent = useCallback((payload) => {
    if (!payload || !payload.type) return;
    const { type } = payload;

    if (type === "NEW_ORDER") {
      const incomingOrder = payload.order;
      if (incomingOrder && incomingOrder.items && incomingOrder.items.length > 0) {
        console.log(`[Captive Portal Order Event] Received NEW_ORDER for table: ${payload.tableId || incomingOrder.tableId}`, incomingOrder);

        const targetTable = resolveTable(payload.tableId || incomingOrder.tableId, tables);
        const dbTableId = targetTable ? targetTable.id : payload.tableId || incomingOrder.tableId;

        // Persist order directly into Supabase PostgreSQL DB
        createOrderInDb({
          tableId: dbTableId,
          items: incomingOrder.items,
          total: incomingOrder.totalAmount || incomingOrder.total || 0,
          notes: incomingOrder.notes || "",
          customerName: payload.customer_name || payload.customerName || incomingOrder.customer_name || incomingOrder.customerName || "Guest",
          customerPhone: payload.customer_phone || payload.customerPhone || incomingOrder.customer_phone || incomingOrder.customerPhone || ""
        }).then((savedDbOrder) => {
          console.log(`[Captive Portal Order Event] Successfully saved order to Supabase DB:`, savedDbOrder);
          loadSupabaseData();
        }).catch((err) => {
          console.error(`[Captive Portal Order Event Error] Failed to save order to Supabase:`, err);
        });
      }
    }

    if (type === "TABLE_CHECKIN" || type === "TABLE_ASSIGNED") {
      const targetTable = resolveTable(payload.tableId, tables);
      const custPhone = payload.customerPhone || "";
      const custName = payload.customerName || "Guest";

      setTables((prev) =>
        prev.map((t) => {
          const match = targetTable ? t.id === targetTable.id : t.id === payload.tableId;
          if (match) {
            return {
              ...t,
              guests: t.guests > 0 ? t.guests : 2,
              seatedTime: t.seatedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              customerName: custName,
              customerPhone: custPhone,
            };
          }
          return t;
        })
      );
    }

    if (type === "TABLE_VACATE" || type === "TABLE_LOGOUT" || type === "PAYMENT_COMPLETED") {
      const tId = payload.table_id || payload.tableId;
      if (tId) {
        markTableNeedsCleaningAndStartTimer(tId);
      }
      loadSupabaseData();
    }
  }, [resolveTable, tables, markTableNeedsCleaningAndStartTimer, loadSupabaseData]);

  // Sync localStorage cross-port events
  useEffect(() => {
    const poll = () => {
      try {
        const raw = localStorage.getItem("truffles_last_event");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.timestamp && parsed.timestamp > lastProcessedTs.current) {
            lastProcessedTs.current = parsed.timestamp;
            processEvent(parsed);
          }
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [processEvent]);

  // ── Internal dashboard & API actions ──

  const goToBillingForTable = (tableId) => {
    setSelectedTableForBilling(tableId);
    setActiveTab("billing");
  };

  const updateTableStatus = async (tableId, newStatus) => {
    const foundTable = resolveTable(tableId, tables);
    const targetId = foundTable ? foundTable.id : tableId;

    if (newStatus === "needs_cleaning") {
      markTableNeedsCleaningAndStartTimer(targetId);
      return;
    }

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        const updated = { ...t, status: newStatus };
        if (newStatus === "vacant") {
          updated.guests = 0;
          updated.seatedTime = null;
          updated.orderId = null;
          updated.activeOrderTotal = 0;
          updated.customerName = null;
          updated.customerPhone = null;
        }
        return updated;
      })
    );

    await updateRestaurantTableStatus(targetId, newStatus);
  };

  const broadcast = (payload) => {
    try {
      localStorage.setItem("truffles_last_event", JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch {}
  };

  const createOrder = async ({
    tableId,
    items,
    guests = 2,
    notes = "",
    customerName = "Guest",
    customerPhone = "",
    customer_name = "Guest",
    customer_phone = ""
  }) => {
    const totalAmount = items.reduce((s, i) => s + i.price * i.qty, 0);

    const foundTable = resolveTable(tableId, tables);
    const dbTableId = foundTable ? foundTable.id : tableId;
    const displayTableId = foundTable ? `T${foundTable.number}` : (String(tableId).startsWith("T") ? tableId : `T${tableId}`);

    const finalCustName = customerName && customerName !== "Guest" ? customerName : (customer_name || "Guest");
    const finalCustPhone = customerPhone || customer_phone || "";

    console.log(`[Table Trace Log] Selected UI tableId: "${tableId}" -> Found Table #${foundTable?.number} -> DB UUID: "${dbTableId}" -> Display: "${displayTableId}" | Customer: ${finalCustName}`);

    // Save to Supabase DB as the ONLY source of truth
    const dbOrder = await createOrderInDb({
      tableId: dbTableId,
      items,
      total: totalAmount,
      notes,
      customerName: finalCustName,
      customerPhone: finalCustPhone
    });

    // Synchronize data model directly from Supabase DB
    await loadSupabaseData();

    const newOrderId = dbOrder?.id || `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderPayload = {
      id: newOrderId,
      tableId: displayTableId,
      table_id: dbTableId,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      customer_name: finalCustName,
      customer_phone: finalCustPhone,
      status: "New",
      order_status: "New",
      payment_status: "Pending",
      createdAt: new Date().toISOString(),
      priority: "normal",
      items,
      notes,
      totalAmount,
      total: totalAmount,
      discount: 0,
      tax: 0
    };

    broadcast({
      type: "NEW_ORDER",
      order: newOrderPayload,
      table_id: dbTableId,
      tableId: displayTableId,
      customer_name: finalCustName,
      customer_phone: finalCustPhone,
      timestamp: Date.now()
    });
    return newOrderId;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const isPaidStatus = newStatus === "Paid" || newStatus === "Completed";
    setActiveOrders((prev) =>
      isPaidStatus
        ? prev.filter((o) => o.id !== orderId)
        : prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    // Sync to Supabase DB (sets payment_status = 'Paid' and order_status = 'Completed')
    await updateOrderStatusInDb(orderId, newStatus);

    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (targetOrder) {
      if (newStatus === "Payment Pending") {
        updateTableStatus(targetOrder.tableId, "awaiting_payment");
      } else if (isPaidStatus) {
        updateTableStatus(targetOrder.tableId, "needs_cleaning");
      }
    }

    broadcast({ type: "UPDATE_ORDER_STATUS", orderId, newStatus });
  };

  const cancelOrder = async (orderId) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    await updateOrderStatusInDb(orderId, "Cancelled");
    await updateTableStatus(targetOrder.tableId, "vacant");
  };

  const bumpOrderPriority = (orderId) => {
    setActiveOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === orderId);
      if (idx === -1) return prev;
      const target = { ...prev[idx], priority: "high" };
      const rest = prev.filter((o) => o.id !== orderId);
      return [target, ...rest];
    });
  };

  const payOrder = async (orderId, paymentDetails) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: targetOrder.id,
      tableId: targetOrder.tableId,
      amount: paymentDetails.grandTotal,
      paidAt: new Date().toISOString(),
      paymentMethod: paymentDetails.method,
      itemsCount: targetOrder.items.length,
      discount: paymentDetails.discount,
      tax: paymentDetails.tax,
      serviceCharge: paymentDetails.serviceCharge,
    };

    setPaidTransactions((prev) => [newTx, ...prev]);
    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));

    // Update in Supabase
    await payOrderInDb(orderId, {
      total: paymentDetails.grandTotal,
      discount: paymentDetails.discount,
      tax: paymentDetails.tax
    });
    await updateTableStatus(targetOrder.tableId, "needs_cleaning");

    setTimeout(async () => {
      await updateTableStatus(targetOrder.tableId, "vacant");
    }, 20000);

    if (selectedTableForBilling === targetOrder.tableId) {
      setSelectedTableForBilling(null);
    }

    broadcast({ type: "PAY_ORDER", orderId, tableId: targetOrder.tableId });
  };

  const submitCustomerFeedback = async ({ orderId, rating, comment }) => {
    await createFeedbackInDb({ orderId, rating, comments: comment });
  };

  // Category CRUD
  const addCategory = async (categoryName) => {
    const created = await createMenuCategory(categoryName);
    if (created) {
      setCategories((prev) => [...prev, mapDbCategory(created)]);
    } else {
      setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: categoryName, icon: "Utensils", sortOrder: prev.length + 1 }]);
    }
  };

  const editCategory = async (categoryId, newName) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name: newName } : c)));
    await updateMenuCategory(categoryId, newName);
  };

  const deleteCategory = async (categoryId) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setMenuItems((prev) => prev.filter((m) => m.categoryId !== categoryId));
    await deleteMenuCategory(categoryId);
  };

  const reorderCategory = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const next = [...categories];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setCategories(next);
  };

  // Menu Item CRUD
  const addMenuItem = async (itemData) => {
    const created = await createMenuItem(itemData);
    if (created) {
      setMenuItems((prev) => [mapDbMenuItem(created), ...prev]);
    } else {
      setMenuItems((prev) => [{ id: `item-${Date.now()}`, ...itemData }, ...prev]);
    }
  };

  const editMenuItem = async (itemId, itemData) => {
    setMenuItems((prev) => prev.map((m) => (m.id === itemId ? { ...m, ...itemData } : m)));
    await updateMenuItem(itemId, itemData);
  };

  const deleteMenuItemAction = async (itemId) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
    await deleteMenuItem(itemId);
  };

  const toggleItemAvailability = async (itemId) => {
    const target = menuItems.find((m) => m.id === itemId);
    if (!target) return;
    const nextAvail = !target.isAvailable;
    setMenuItems((prev) => prev.map((m) => (m.id === itemId ? { ...m, isAvailable: nextAvail } : m)));
    await updateMenuItem(itemId, { isAvailable: nextAvail });
  };

  return (
    <RestoContext.Provider
      value={{
        branches: INITIAL_BRANCHES,
        currentBranch,
        setCurrentBranch,
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        activeWaiter,
        setActiveWaiter: handleSetActiveWaiter,
        activeTab,
        setActiveTab: handleSetActiveTab,
        tables,
        categories,
        menuItems,
        activeOrders,
        getActiveOrderForTable,
        paidTransactions,
        selectedTableForBilling,
        setSelectedTableForBilling,
        goToBillingForTable,
        updateTableStatus,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        bumpOrderPriority,
        payOrder,
        submitCustomerFeedback,
        addCategory,
        editCategory,
        deleteCategory,
        reorderCategory,
        addMenuItem,
        editMenuItem,
        deleteMenuItem: deleteMenuItemAction,
        toggleItemAvailability,
        isDbLoaded
      }}
    >
      {children}
    </RestoContext.Provider>
  );
};

// Strict per-table active order mapping helper
export const getActiveOrderForTable = (table, allOrders) => {
  if (!table || !allOrders) return null;

  return allOrders.find(
    (order) =>
      (order.table_id === table.id || order.tableId === table.id || Number(order.table_number) === Number(table.number)) &&
      order.order_status !== "Completed" &&
      order.order_status !== "Cancelled" &&
      order.status !== "Completed" &&
      order.status !== "Cancelled" &&
      order.payment_status !== "Paid"
  );
};

export const useResto = () => {
  const context = useContext(RestoContext);
  if (!context) throw new Error("useResto must be used within a RestoProvider");
  return context;
};
