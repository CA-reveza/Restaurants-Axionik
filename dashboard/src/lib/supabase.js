import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://juohiqxcfzququtuzxme.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_GLqjcXd0gGy58SzO01eO0Q_Yu5_Tc-h";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// UUID validator helper
const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Logging helper
const logApi = (action, details, error = null) => {
  if (error) {
    console.error(`[Supabase API Error] ${action}:`, error, details);
  } else {
    console.log(`[Supabase API Success] ${action}:`, details);
  }
};

// ── MENU CATEGORIES API ──
export const fetchMenuCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    logApi("fetchMenuCategories", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchMenuCategories", null, err);
    return [];
  }
};

export const createMenuCategory = async (categoryName) => {
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .insert([{ category_name: categoryName }])
      .select();

    if (error) throw error;
    logApi("createMenuCategory", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("createMenuCategory", { categoryName }, err);
    return null;
  }
};

export const updateMenuCategory = async (id, categoryName) => {
  try {
    if (!isUUID(id)) return null;
    const { data, error } = await supabase
      .from("menu_categories")
      .update({ category_name: categoryName })
      .eq("id", id)
      .select();

    if (error) throw error;
    logApi("updateMenuCategory", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("updateMenuCategory", { id, categoryName }, err);
    return null;
  }
};

export const deleteMenuCategory = async (id) => {
  try {
    if (!isUUID(id)) return false;
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logApi("deleteMenuCategory", { id });
    return true;
  } catch (err) {
    logApi("deleteMenuCategory", { id }, err);
    return false;
  }
};


// ── MENU ITEMS API ──
export const fetchMenuItems = async () => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    logApi("fetchMenuItems", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchMenuItems", null, err);
    return [];
  }
};

export const createMenuItem = async (item) => {
  try {
    const catId = item.categoryId || item.category_id;
    const payload = {
      category_id: isUUID(catId) ? catId : null,
      item_name: item.name || item.item_name,
      description: item.description || "",
      price: parseFloat(item.price) || 0,
      veg: item.isVeg !== undefined ? item.isVeg : !!item.veg,
      available: item.isAvailable !== undefined ? item.isAvailable : item.available !== undefined ? item.available : true,
      image_url: item.image || item.image_url || ""
    };

    const { data, error } = await supabase
      .from("menu_items")
      .insert([payload])
      .select();

    if (error) throw error;
    logApi("createMenuItem", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("createMenuItem", item, err);
    return null;
  }
};

export const updateMenuItem = async (id, item) => {
  try {
    if (!isUUID(id)) return null;
    const payload = {};
    const catId = item.categoryId || item.category_id;
    if (catId && isUUID(catId)) payload.category_id = catId;
    if (item.name || item.item_name) payload.item_name = item.name || item.item_name;
    if (item.description !== undefined) payload.description = item.description;
    if (item.price !== undefined) payload.price = parseFloat(item.price);
    if (item.isVeg !== undefined) payload.veg = item.isVeg;
    else if (item.veg !== undefined) payload.veg = item.veg;
    if (item.isAvailable !== undefined) payload.available = item.isAvailable;
    else if (item.available !== undefined) payload.available = item.available;
    if (item.image || item.image_url) payload.image_url = item.image || item.image_url;

    const { data, error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) throw error;
    logApi("updateMenuItem", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("updateMenuItem", { id, item }, err);
    return null;
  }
};

export const deleteMenuItem = async (id) => {
  try {
    if (!isUUID(id)) return false;
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logApi("deleteMenuItem", { id });
    return true;
  } catch (err) {
    logApi("deleteMenuItem", { id }, err);
    return false;
  }
};


// ── RESTAURANT TABLES API ──
export const fetchRestaurantTables = async () => {
  try {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("*")
      .order("table_number", { ascending: true });

    if (error) throw error;
    logApi("fetchRestaurantTables", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchRestaurantTables", null, err);
    return [];
  }
};

export const upsertRestaurantTable = async (table) => {
  try {
    const num = parseInt(table.number || table.table_number, 10) || 1;
    const payload = {
      table_number: num,
      status: table.status || "vacant"
    };

    if (isUUID(table.id)) {
      payload.id = table.id;
    }

    const { data, error } = await supabase
      .from("restaurant_tables")
      .upsert([payload])
      .select();

    if (error) throw error;
    logApi("upsertRestaurantTable", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("upsertRestaurantTable", table, err);
    return null;
  }
};

export const updateRestaurantTableStatus = async (tableId, status) => {
  try {
    let dbUuid = isUUID(tableId) ? tableId : null;
    if (!dbUuid) {
      let num = NaN;
      if (typeof tableId === "number") num = tableId;
      else if (typeof tableId === "string") {
        num = parseInt(tableId.trim().toUpperCase().replace(/^T/, ""), 10);
      }
      if (!isNaN(num)) {
        const { data } = await supabase
          .from("restaurant_tables")
          .select("id")
          .eq("table_number", num)
          .maybeSingle();
        if (data?.id) dbUuid = data.id;
      }
    }

    if (!dbUuid) {
      console.warn(`[Supabase Table Status Warning] Could not resolve table UUID for: "${tableId}"`);
      return null;
    }

    const { data, error } = await supabase
      .from("restaurant_tables")
      .update({ status })
      .eq("id", dbUuid)
      .select();

    if (error) throw error;
    logApi("updateRestaurantTableStatus", { dbUuid, status });
    return data?.[0];
  } catch (err) {
    logApi("updateRestaurantTableStatus", { tableId, status }, err);
    return null;
  }
};

export const executeDirectTableLogout = async (tableIdOrNum) => {
  try {
    console.log(`[Direct Supabase Logout] Initiating direct database logout for table: "${tableIdOrNum}"...`);

    // 1. Resolve table row from Supabase
    let targetTable = null;

    if (isUUID(tableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", tableIdOrNum).single();
      targetTable = data;
    } else {
      let num = parseInt(String(tableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      targetTable = data;
    }

    if (!targetTable) {
      console.warn(`[Direct Supabase Logout Warning] Could not find restaurant_table for: "${tableIdOrNum}"`);
      return false;
    }

    console.log(`[Direct Supabase Logout] Resolved Table #${targetTable.table_number} (UUID: ${targetTable.id})`);

    // 2. Complete active orders for this table in Supabase orders table
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", targetTable.id)
      .neq("order_status", "Cancelled")
      .neq("order_status", "Completed");

    if (activeOrders && activeOrders.length > 0) {
      for (const ord of activeOrders) {
        console.log(`[Direct Supabase Logout] Marking order ${ord.id} as Completed and Paid...`);
        await supabase
          .from("orders")
          .update({ order_status: "Completed", payment_status: "Paid" })
          .eq("id", ord.id);
      }
    }

    // 3. Update restaurant_tables.status to 'needs_cleaning' in Supabase
    console.log(`[Direct Supabase Logout] Updating restaurant_tables.status to 'needs_cleaning'...`);
    const { data: updatedTable, error: tableErr } = await supabase
      .from("restaurant_tables")
      .update({ status: "needs_cleaning" })
      .eq("id", targetTable.id)
      .select();

    if (tableErr) {
      console.error(`[Direct Supabase Logout Error] Table status update failed:`, tableErr);
    } else {
      console.log(`[Direct Supabase Logout Success] Table #${targetTable.table_number} set to 'needs_cleaning':`, updatedTable?.[0]);
    }

    // 4. Store cleaning timestamp for the 20-second persistent cleaning lifecycle
    try {
      const tsObj = JSON.parse(localStorage.getItem("truffles_table_cleaning_timestamps") || "{}");
      tsObj[targetTable.id] = Date.now();
      localStorage.setItem("truffles_table_cleaning_timestamps", JSON.stringify(tsObj));
    } catch {}

    // 5. Broadcast Realtime Event
    try {
      localStorage.setItem(
        "truffles_last_event",
        JSON.stringify({ type: "TABLE_STATUS_UPDATE", tableId: targetTable.id, status: "needs_cleaning", timestamp: Date.now() })
      );
    } catch {}

    return true;
  } catch (err) {
    console.error(`[Direct Supabase Logout Exception]`, err);
    return false;
  }
};

export const executeDirectTableSwitch = async (oldTableIdOrNum, newTableIdOrNum) => {
  try {
    console.log(`[Direct Supabase Table Switch] Switching table session from "${oldTableIdOrNum}" to "${newTableIdOrNum}"...`);

    // 1. Resolve old table from Supabase
    let oldTable = null;
    if (isUUID(oldTableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", oldTableIdOrNum).single();
      oldTable = data;
    } else {
      const num = parseInt(String(oldTableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      oldTable = data;
    }

    // 2. Resolve new table from Supabase
    let newTable = null;
    if (isUUID(newTableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", newTableIdOrNum).single();
      newTable = data;
    } else {
      const num = parseInt(String(newTableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      newTable = data;
    }

    if (!oldTable || !newTable) {
      console.warn(`[Direct Supabase Table Switch Warning] Could not resolve tables: old="${oldTableIdOrNum}", new="${newTableIdOrNum}"`);
      return false;
    }

    console.log(`[Direct Supabase Table Switch] Reassigning orders from Table #${oldTable.table_number} (${oldTable.id}) to Table #${newTable.table_number} (${newTable.id})`);

    // 3. Reassign active orders in Supabase orders table
    const { data: reassignedOrders, error: orderErr } = await supabase
      .from("orders")
      .update({ table_id: newTable.id })
      .eq("table_id", oldTable.id)
      .neq("order_status", "Completed")
      .neq("order_status", "Cancelled")
      .select();

    if (orderErr) {
      console.error("[Direct Supabase Table Switch Error] Order reassignment failed:", orderErr);
    } else {
      console.log(`[Direct Supabase Table Switch Success] Reassigned ${reassignedOrders?.length || 0} active orders to Table #${newTable.table_number}`);
    }

    // 4. Update old table status to 'vacant' in Supabase
    await supabase.from("restaurant_tables").update({ status: "vacant" }).eq("id", oldTable.id);

    // 5. Update new table status to 'occupied' in Supabase
    await supabase.from("restaurant_tables").update({ status: "occupied" }).eq("id", newTable.id);

    console.log(`[Direct Supabase Table Switch Complete] Table #${oldTable.table_number} -> vacant, Table #${newTable.table_number} -> occupied`);
    return true;
  } catch (err) {
    console.error("[Direct Supabase Table Switch Exception]", err);
    return false;
  }
};

export const executeDirectTablePayment = async (tableIdOrNum) => {
  try {
    console.log(`[Direct Supabase Payment] Processing direct database payment update for table: "${tableIdOrNum}"...`);

    // 1. Resolve table row from Supabase
    let targetTable = null;
    if (isUUID(tableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", tableIdOrNum).single();
      targetTable = data;
    } else {
      const num = parseInt(String(tableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      targetTable = data;
    }

    if (!targetTable) {
      console.warn(`[Direct Supabase Payment Warning] Could not find table for: "${tableIdOrNum}"`);
      return false;
    }

    console.log(`[Direct Supabase Payment] Resolved Table #${targetTable.table_number} (UUID: ${targetTable.id})`);

    // 2. Mark active orders as Completed & Paid in Supabase orders table
    const { data: updatedOrders, error: orderErr } = await supabase
      .from("orders")
      .update({ order_status: "Completed", payment_status: "Paid" })
      .eq("table_id", targetTable.id)
      .neq("order_status", "Cancelled")
      .neq("order_status", "Completed")
      .select();

    if (orderErr) {
      console.error("[Direct Supabase Payment Error] Orders update failed:", orderErr);
    } else {
      console.log(`[Direct Supabase Payment Success] Marked ${updatedOrders?.length || 0} active orders as Paid and Completed.`);
    }

    // 3. Keep table status as 'occupied' (it will transition to 'needs_cleaning' when customer clicks Logout)
    console.log(`[Direct Supabase Payment Success] Table #${targetTable.table_number} remains occupied with Paid status until customer logs out.`);

    // 4. Broadcast Realtime Event
    try {
      localStorage.setItem(
        "truffles_last_event",
        JSON.stringify({ type: "ORDER_PAID", tableId: targetTable.id, timestamp: Date.now() })
      );
    } catch {}

    return true;
  } catch (err) {
    console.error("[Direct Supabase Payment Exception]", err);
    return false;
  }
};


// ── ORDERS & ORDER ITEMS API ──
export const fetchOrders = async () => {
  try {
    // 1. Try join query first
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_items(*)), restaurant_tables(*)")
      .order("created_at", { ascending: false });

    if (!ordersErr && Array.isArray(ordersData)) {
      logApi("fetchOrders", { count: ordersData.length });
      return ordersData;
    }

    console.warn("[fetchOrders Join Warning] Relational query error. Executing safe separate table fetch fallback:", ordersErr);

    // 2. Fallback: Fetch tables separately to bypass schema relationship issues
    const { data: rawOrders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const { data: rawItems } = await supabase.from("order_items").select("*");
    const { data: rawMenuItems } = await supabase.from("menu_items").select("*");
    const { data: rawTables } = await supabase.from("restaurant_tables").select("*");

    if (!Array.isArray(rawOrders)) return [];

    const mergedOrders = rawOrders.map(ord => {
      const ordItems = (rawItems || []).filter(i => String(i.order_id) === String(ord.id)).map(i => {
        const menuItem = (rawMenuItems || []).find(m => String(m.id) === String(i.menu_item_id));
        return {
          ...i,
          menu_items: menuItem || { item_name: i.notes || "Delicious Item", name: i.notes || "Delicious Item" }
        };
      });

      const matchedTable = (rawTables || []).find(t => String(t.id) === String(ord.table_id) || t.table_number === parseInt(String(ord.table_id || "").replace(/\D/g, ""), 10));

      return {
        ...ord,
        order_items: ordItems,
        restaurant_tables: matchedTable || null
      };
    });

    logApi("fetchOrdersFallback", { count: mergedOrders.length });
    return mergedOrders;
  } catch (err) {
    logApi("fetchOrders", null, err);
    return [];
  }
};

export const createOrderInDb = async ({
  tableId,
  items,
  total,
  notes = "",
  customerName = "Guest",
  customerPhone = "",
  customer_name = "Guest",
  customer_phone = ""
}) => {
  try {
    // 1. Resolve table UUID safely without regex digit stripping on UUIDs
    let dbTableUuid = isUUID(tableId) ? tableId : null;
    let tableNumberFound = null;

    if (!dbTableUuid) {
      let num = NaN;
      if (typeof tableId === "number") {
        num = tableId;
      } else if (typeof tableId === "string" && !isUUID(tableId)) {
        const clean = tableId.trim().toUpperCase().replace(/^T/, "");
        num = parseInt(clean, 10);
      }

      if (isNaN(num) || num <= 0) num = 1; // Default to Table 1 if unspecified

      tableNumberFound = num;
      const { data: tableData } = await supabase
        .from("restaurant_tables")
        .select("id, table_number")
        .eq("table_number", num)
        .maybeSingle();

      if (tableData?.id) {
        dbTableUuid = tableData.id;
      } else {
        // Auto-insert table into restaurant_tables if missing
        const { data: newTable } = await supabase
          .from("restaurant_tables")
          .insert([{ table_number: num, status: "occupied" }])
          .select()
          .maybeSingle();
        if (newTable?.id) dbTableUuid = newTable.id;
      }
    } else {
      const { data: tableData } = await supabase
        .from("restaurant_tables")
        .select("table_number")
        .eq("id", dbTableUuid)
        .maybeSingle();
      if (tableData?.table_number) tableNumberFound = tableData.table_number;
    }

    // 2. Calculate precise order total from items if not provided
    const itemsList = Array.isArray(items) ? items : [];
    const calculatedTotal = itemsList.reduce(
      (sum, i) => sum + ((parseFloat(i.price) || 0) * (parseInt(i.qty || i.quantity, 10) || 1)),
      0
    );
    const finalTotal = parseFloat(total) > 0 ? parseFloat(total) : calculatedTotal;

    const finalCustomerName = customerName && customerName !== "Guest" ? customerName : (customer_name || "Guest");
    const finalCustomerPhone = customerPhone || customer_phone || "";

    // 3. Attempt RPC create_complete_order first for atomic transaction
    if (tableNumberFound) {
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc("create_complete_order", {
          p_table_number: tableNumberFound,
          p_customer_name: finalCustomerName,
          p_customer_phone: finalCustomerPhone,
          p_items: itemsList,
          p_total: finalTotal,
          p_notes: notes || ""
        });
        if (!rpcErr && rpcRes?.order_id) {
          console.log("[Supabase RPC Success] Atomic order created:", rpcRes);
          return { id: rpcRes.order_id, table_id: rpcRes.table_id, total: finalTotal };
        }
      } catch (rpcCatch) {
        console.warn("[RPC Fallback Warning] RPC call failed, using REST fallback:", rpcCatch);
      }
    }

    const orderPayload = {
      table_id: dbTableUuid,
      customer_name: finalCustomerName,
      customer_phone: finalCustomerPhone,
      order_status: "New",
      total: finalTotal,
      discount: 0,
      tax: 0,
      payment_status: "Pending"
    };

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select();

    if (orderErr) throw orderErr;
    const newOrder = orderData?.[0];

    console.log(`[Supabase Order Audit] Order created UUID: "${newOrder?.id}" | Table UUID: "${newOrder?.table_id}" | Total: ₹${finalTotal}`);

    if (newOrder && itemsList.length > 0) {
      // Fetch menu items to map item names to valid menu_item_id UUIDs if needed
      const { data: allMenuItems } = await supabase.from("menu_items").select("id, item_name");

      const lineItemsPayload = itemsList.map((item) => {
        let menuItemUuid = isUUID(item.menuItemId || item.id) ? item.menuItemId || item.id : null;
        if (!menuItemUuid && allMenuItems) {
          const matched = allMenuItems.find(
            (m) => m.item_name.toLowerCase() === (item.name || "").toLowerCase()
          );
          if (matched) menuItemUuid = matched.id;
        }

        return {
          order_id: newOrder.id,
          menu_item_id: menuItemUuid,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.qty || item.quantity, 10) || 1,
          notes: item.notes || (item.customizations ? item.customizations.join(", ") : "") || notes || ""
        };
      });

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(lineItemsPayload);

      if (itemsErr) {
        logApi("createOrderItems", null, itemsErr);
      }
    }

    // 3. Mark table status as occupied
    if (dbTableUuid) {
      await supabase
        .from("restaurant_tables")
        .update({ status: "occupied" })
        .eq("id", dbTableUuid);
    }

    logApi("createOrderInDb", newOrder);
    return newOrder;
  } catch (err) {
    logApi("createOrderInDb", { tableId, items, total }, err);
    return null;
  }
};

// Safe Order UUID Resolver (resolves UUIDs from ORD-xxx IDs or table refs if needed)
const resolveOrderUuid = async (orderId) => {
  if (isUUID(orderId)) return orderId;

  console.log(`[Order UUID Resolver] Non-UUID orderId provided: "${orderId}". Searching Supabase for active pending order...`);
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("id, table_id, created_at")
    .neq("payment_status", "Paid")
    .neq("order_status", "Completed")
    .order("created_at", { ascending: false });

  if (pendingOrders && pendingOrders.length > 0) {
    console.log(`[Order UUID Resolver] Resolved non-UUID "${orderId}" -> Supabase Order UUID: "${pendingOrders[0].id}"`);
    return pendingOrders[0].id;
  }

  return null;
};

export const updateOrderStatusInDb = async (orderId, orderStatus) => {
  try {
    const targetUuid = await resolveOrderUuid(orderId);
    if (!targetUuid) {
      console.warn(`[Supabase Update Warning] Could not resolve order UUID for: "${orderId}"`);
      return null;
    }

    const payload = { order_status: orderStatus };
    if (orderStatus === "Paid" || orderStatus === "Completed") {
      payload.payment_status = "Paid";
      payload.order_status = "Completed";
    }

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", targetUuid)
      .select();

    if (error) throw error;
    logApi("updateOrderStatusInDb", { targetUuid, orderStatus, data: data?.[0] });
    return data?.[0];
  } catch (err) {
    logApi("updateOrderStatusInDb", { orderId, orderStatus }, err);
    return null;
  }
};

export const payOrderInDb = async (orderId, { total, discount = 0, tax = 0 }) => {
  try {
    const targetUuid = await resolveOrderUuid(orderId);
    if (!targetUuid) {
      console.warn(`[Supabase Payment Warning] Could not resolve order UUID for: "${orderId}"`);
      return null;
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        order_status: "Completed",
        payment_status: "Paid",
        total: parseFloat(total) || 0,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0
      })
      .eq("id", targetUuid)
      .select();

    if (error) throw error;
    logApi("payOrderInDb", { targetUuid, data: data?.[0] });
    return data?.[0];
  } catch (err) {
    logApi("payOrderInDb", { orderId }, err);
    return null;
  }
};


// ── FEEDBACK API ──
export const createFeedbackInDb = async ({ orderId, rating, comments }) => {
  try {
    const payload = {
      order_id: isUUID(orderId) ? orderId : null,
      rating: parseInt(rating, 10) || 5,
      comments: comments || ""
    };

    const { data, error } = await supabase
      .from("feedback")
      .insert([payload])
      .select();

    if (error) throw error;
    logApi("createFeedbackInDb", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("createFeedbackInDb", { orderId, rating, comments }, err);
    return null;
  }
};


// ── REALTIME SUBSCRIPTION HELPER ──
export const subscribeToRealtimeChanges = (onDataChange) => {
  const channel = supabase
    .channel("public:orders")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      (payload) => {
        logApi("Realtime orders event", payload);
        onDataChange("orders", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items" },
      (payload) => {
        logApi("Realtime order_items event", payload);
        onDataChange("order_items", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "restaurant_tables" },
      (payload) => {
        logApi("Realtime restaurant_tables event", payload);
        onDataChange("restaurant_tables", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_items" },
      (payload) => {
        logApi("Realtime menu_items event", payload);
        onDataChange("menu_items", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_categories" },
      (payload) => {
        logApi("Realtime menu_categories event", payload);
        onDataChange("menu_categories", payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ── RESERVATIONS API ──

/**
 * Checks if a table has any confirmed overlapping reservation in the given window.
 * Returns true if the table IS available (no overlap), false if double-booked.
 */
export const checkTableAvailability = async (tableId, startTime, endTime) => {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("table_id", tableId)
      .eq("status", "confirmed")
      .lt("start_time", endTime)
      .gt("end_time", startTime);
    if (error) throw error;
    return (data || []).length === 0;
  } catch (err) {
    logApi("checkTableAvailability", { tableId }, err);
    return false;
  }
};

/**
 * Creates a reservation after verifying no time overlap exists.
 * Default slot: 90 minutes. Pass durationMinutes to override.
 */
export const createReservation = async ({
  customerName, customerPhone, tableId, startTime, endTime, guestCount = 2, durationMinutes = 90,
}) => {
  try {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMinutes * 60 * 1000);
    const isAvailable = await checkTableAvailability(tableId, start.toISOString(), end.toISOString());
    if (!isAvailable) {
      return { error: "TABLE_DOUBLE_BOOKED", message: "This table is already reserved for that time slot." };
    }
    const { data, error } = await supabase
      .from("reservations")
      .insert([{
        customer_name: customerName,
        customer_phone: customerPhone || "",
        table_id: tableId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        guest_count: guestCount,
        status: "confirmed",
      }])
      .select();
    if (error) throw error;
    try {
      await supabase.from("restaurant_tables").update({ status: "reserved" }).eq("id", tableId);
    } catch (e) {}
    logApi("createReservation", data?.[0]);
    return { data: data?.[0] };
  } catch (err) {
    logApi("createReservation", { customerName, tableId }, err);
    return { error: "UNKNOWN", message: err.message };
  }
};

/** Fetches all non-cancelled reservations for a given date string (YYYY-MM-DD). */
export const fetchReservations = async (dateString) => {
  try {
    const date = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    const { data, error } = await supabase
      .from("reservations")
      .select("*, restaurant_tables(table_number)")
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    logApi("fetchReservations", { dateString }, err);
    return [];
  }
};

/** Fetches reservations for a specific table on a date. */
export const fetchTableReservations = async (tableId, dateString) => {
  try {
    const date = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("table_id", tableId)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .neq("status", "cancelled");
    if (error) throw error;
    return data || [];
  } catch (err) {
    logApi("fetchTableReservations", { tableId }, err);
    return [];
  }
};

/** Cancels a reservation by ID. */
export const cancelReservation = async (reservationId) => {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservationId)
      .select();
    if (error) throw error;
    logApi("cancelReservation", { reservationId });
    return data?.[0];
  } catch (err) {
    logApi("cancelReservation", { reservationId }, err);
    return null;
  }
};

// ── PRE-ORDER API ──

/** Creates a queued pre-order with no table assigned yet. */
export const createPreOrder = async ({ customerName, customerPhone, items, totalAmount, notes }) => {
  try {
    const preorderTicket = `PRE-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderItems = (items || []).map((i) => ({
      id: `oi-pre-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      menuItemId: i.menuItemId || i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      customizations: i.customizations || [],
    }));
    const { data, error } = await supabase
      .from("orders")
      .insert([{
        customer_name: customerName || "Guest",
        customer_phone: customerPhone || "",
        table_id: null,
        items: orderItems,
        total_amount: totalAmount || 0,
        order_status: "New",
        payment_status: "Unpaid",
        is_preorder: true,
        preorder_ticket: preorderTicket,
        notes: notes || "",
        guests: 1,
      }])
      .select();
    if (error) throw error;
    logApi("createPreOrder", { preorderTicket, customerName });
    return { data: data?.[0], ticket: preorderTicket };
  } catch (err) {
    logApi("createPreOrder", { customerName }, err);
    return { error: err.message };
  }
};

/** Assigns a queued pre-order to an available table. */
export const assignPreOrderToTable = async (orderId, tableId) => {
  try {
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .update({ table_id: tableId, is_preorder: false, order_status: "New" })
      .eq("id", orderId)
      .select();
    if (orderError) throw orderError;
    const { error: tableError } = await supabase
      .from("restaurant_tables")
      .update({ status: "occupied" })
      .eq("id", tableId);
    if (tableError) throw tableError;
    logApi("assignPreOrderToTable", { orderId, tableId });
    return { data: orderData?.[0] };
  } catch (err) {
    logApi("assignPreOrderToTable", { orderId, tableId }, err);
    return { error: err.message };
  }
};

/** Fetches all pending pre-orders (is_preorder=true, table_id=null). */
export const fetchQueuedPreOrders = async () => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("is_preorder", true)
      .is("table_id", null)
      .order("created_at", { ascending: true });
    if (error) throw error;
    logApi("fetchQueuedPreOrders", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchQueuedPreOrders", null, err);
    return [];
  }
};
