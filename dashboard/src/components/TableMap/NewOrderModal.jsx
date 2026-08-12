import React, { useState } from "react";
import { useResto } from "../../context/RestoContext";
import { X, Plus, Minus, Search, ShoppingBag, Utensils, Check } from "lucide-react";

export const NewOrderModal = ({ table, onClose }) => {
  const { menuItems, categories, createOrder } = useResto();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [guestsCount, setGuestsCount] = useState(table.guests || 2);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState("");

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && item.isAvailable;
  });

  const handleAddItem = (item) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            id: `oi-${Date.now()}-${Math.random()}`,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            qty: 1,
            customizations: []
          }
        ];
      }
    });
  };

  const handleUpdateQty = (menuItemId, delta) => {
    setOrderItems((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      alert("Please add at least one item to the order.");
      return;
    }

    createOrder({
      tableId: table.id,
      items: orderItems,
      guests: guestsCount,
      notes
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content new-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>New Order — Table {table.number}</h2>
            <div className="guest-counter">
              <span className="caption-text">Guests:</span>
              <button onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}>-</button>
              <span className="price-mono" style={{ fontSize: "14px" }}>{guestsCount}</span>
              <button onClick={() => setGuestsCount(guestsCount + 1)}>+</button>
            </div>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body new-order-split">
          {/* Menu Selector (Left) */}
          <div className="menu-selector-panel">
            <div className="menu-filter-bar">
              <div className="search-input-box">
                <Search size={16} color="#666680" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="category-pills-row">
                <button
                  className={`cat-pill ${selectedCategory === "all" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("all")}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`cat-pill ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="dishes-grid">
              {filteredItems.map((item) => {
                const inCartItem = orderItems.find((i) => i.menuItemId === item.id);
                return (
                  <div key={item.id} className="dish-card" onClick={() => handleAddItem(item)}>
                    <div className="dish-img-wrapper">
                      <img src={item.image} alt={item.name} />
                      <span className={`veg-indicator-dot ${item.isVeg ? "veg" : "nonveg"}`}>
                        <span className="dot-inner"></span>
                      </span>
                    </div>
                    <div className="dish-info">
                      <div className="dish-title">{item.name}</div>
                      <div className="dish-price-row">
                        <span className="price-mono">₹{item.price}</span>
                        {inCartItem ? (
                          <span className="badge-tag active">{inCartItem.qty} in order</span>
                        ) : (
                          <span className="caption-text" style={{ color: "var(--accent)" }}>
                            + Add
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary (Right) */}
          <div className="cart-summary-panel">
            <div className="cart-header">
              <ShoppingBag size={18} color="var(--accent)" />
              <h3>Order Basket ({orderItems.length})</h3>
            </div>

            <div className="cart-items-scroll">
              {orderItems.length === 0 ? (
                <div className="empty-cart-text" style={{ textAlign: "center", padding: "40px 0" }}>
                  <Utensils size={32} color="#666680" />
                  <p className="caption-text" style={{ marginTop: "12px" }}>
                    Select menu items to build Table {table.number}'s order.
                  </p>
                </div>
              ) : (
                orderItems.map((item) => (
                  <div key={item.menuItemId} className="cart-item-card">
                    <div className="cart-item-title-row">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="price-mono">₹{item.price * item.qty}</span>
                    </div>
                    <div className="cart-item-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="caption-text">₹{item.price} each</span>
                      <div className="qty-picker">
                        <button onClick={() => handleUpdateQty(item.menuItemId, -1)}>
                          <Minus size={12} />
                        </button>
                        <span className="price-mono" style={{ fontSize: "13px" }}>{item.qty}</span>
                        <button onClick={() => handleUpdateQty(item.menuItemId, 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="notes-input-box">
              <label className="caption-text">Kitchen Notes / Instructions:</label>
              <textarea
                placeholder="e.g. Less spicy, extra sauce..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="cart-footer">
              <div className="total-display" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Subtotal</span>
                <span className="timer-stats-mono" style={{ fontSize: "20px" }}>₹{subtotal}</span>
              </div>
              <button
                className="btn-primary"
                style={{ width: "100%" }}
                disabled={orderItems.length === 0}
                onClick={handleSubmitOrder}
              >
                <Check size={18} /> Send Order to KDS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
