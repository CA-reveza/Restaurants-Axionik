import React, { useState } from "react";
import { useResto } from "../../context/RestoContext";
import { MenuItemModal } from "./MenuItemModal";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  GripVertical
} from "lucide-react";

export const MenuManager = () => {
  const {
    categories,
    menuItems,
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategory,
    deleteMenuItem,
    toggleItemAvailability
  } = useResto();

  const [selectedCatId, setSelectedCatId] = useState(
    categories[0] ? categories[0].id : ""
  );

  // New Category Input state
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  // Item Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);

  // Search Filter for Items
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = activeCategory ? item.categoryId === activeCategory.id : true;
    const matchesSearch = item.name.toLowerCase().includes(itemSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName("");
  };

  const handleSaveCatEdit = (catId) => {
    if (!editingCatName.trim()) return;
    editCategory(catId, editingCatName.trim());
    setEditingCatId(null);
  };

  const handleDeleteCategory = (catId) => {
    if (window.confirm("Deleting this category will also remove all items inside it. Continue?")) {
      deleteCategory(catId);
      if (selectedCatId === catId && categories.length > 1) {
        setSelectedCatId(categories.find((c) => c.id !== catId).id);
      }
    }
  };

  return (
    <div className="menu-manager-container">
      {/* Header Bar */}
      <div className="menu-manager-header">
        <div>
          <h2>Menu & Catalog Manager</h2>
          <span className="subtitle">Configure categories, items, pricing, and stock status</span>
        </div>

        <button
          className="btn-primary-action"
          disabled={!activeCategory}
          onClick={() => {
            setSelectedItemForEdit(null);
            setShowItemModal(true);
          }}
        >
          <Plus size={18} /> Add New Dish / Item
        </button>
      </div>

      {/* Two Panel Layout */}
      <div className="menu-two-panel">
        {/* Left Panel: Categories List */}
        <div className="category-panel">
          <div className="panel-header">
            <h3>Categories ({categories.length})</h3>
          </div>

          {/* Add Category Input Form */}
          <form className="add-cat-form" onSubmit={handleAddCategorySubmit}>
            <input
              type="text"
              placeholder="+ New Category Name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <button type="submit" className="btn-add-cat">
              <Plus size={16} />
            </button>
          </form>

          {/* Categories List */}
          <div className="categories-list">
            {categories.map((cat, idx) => {
              const itemCount = menuItems.filter((m) => m.categoryId === cat.id).length;
              const isSelected = cat.id === selectedCatId;

              return (
                <div
                  key={cat.id}
                  className={`category-item-row ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedCatId(cat.id)}
                >
                  <div className="reorder-handle">
                    <button
                      title="Move Up"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderCategory(idx, "up");
                      }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      title="Move Down"
                      disabled={idx === categories.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderCategory(idx, "down");
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {editingCatId === cat.id ? (
                    <input
                      type="text"
                      className="edit-cat-input"
                      value={editingCatName}
                      autoFocus
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onBlur={() => handleSaveCatEdit(cat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCatEdit(cat.id);
                      }}
                    />
                  ) : (
                    <div className="cat-title-wrap">
                      <span className="cat-name">{cat.name}</span>
                      <span className="item-count-badge">{itemCount} items</span>
                    </div>
                  )}

                  <div className="cat-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-action"
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditingCatName(cat.name);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="icon-action delete"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Menu Items Grid */}
        <div className="items-panel">
          <div className="panel-header-row">
            <div>
              <h3>
                {activeCategory ? activeCategory.name : "Select Category"}
                <span className="count">({filteredItems.length} Dishes)</span>
              </h3>
            </div>

            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Filter items in this category..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-items-grid">
            {filteredItems.length === 0 ? (
              <div className="no-items-placeholder">
                <p>No dishes found in this category.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedItemForEdit(null);
                    setShowItemModal(true);
                  }}
                >
                  <Plus size={16} /> Add First Item
                </button>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className={`admin-item-card ${!item.isAvailable ? "out-of-stock" : ""}`}>
                  <div className="card-image-wrap">
                    <img src={item.image} alt={item.name} />
                    <span className={`veg-badge ${item.isVeg ? "veg" : "nonveg"}`}>
                      <span className="dot"></span>
                    </span>

                    <button
                      className="btn-edit-overlay"
                      onClick={() => {
                        setSelectedItemForEdit(item);
                        setShowItemModal(true);
                      }}
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                  </div>

                  <div className="card-content">
                    <div className="item-title">{item.name}</div>
                    <div className="item-desc">{item.description}</div>

                    <div className="item-meta-row">
                      <span className="item-price">₹{item.price}</span>
                      <span className="prep-time">
                        <Clock size={13} /> {item.prepTime} mins
                      </span>
                    </div>

                    {/* Stock Availability Toggle Switch */}
                    <div className="availability-row">
                      <span className="avail-label">In Stock:</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={() => toggleItemAvailability(item.id)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    {/* Customizations tags */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="customizations-preview">
                        <small>Add-ons ({item.customizations.length}):</small>
                        <span className="tags">
                          {item.customizations.map((c) => `${c.name} (+₹${c.price})`).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <MenuItemModal
          item={selectedItemForEdit}
          categoryId={selectedCatId}
          onClose={() => setShowItemModal(false)}
        />
      )}
    </div>
  );
};
