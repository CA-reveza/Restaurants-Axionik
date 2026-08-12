import React, { useState } from "react";
import { useResto } from "../../context/RestoContext";
import { X, Plus, Trash2, Image, Clock, Check } from "lucide-react";

export const MenuItemModal = ({ item, categoryId, onClose }) => {
  const { addMenuItem, editMenuItem } = useResto();

  const isEditing = Boolean(item);

  const [name, setName] = useState(item ? item.name : "");
  const [description, setDescription] = useState(item ? item.description : "");
  const [price, setPrice] = useState(item ? item.price : "");
  const [isVeg, setIsVeg] = useState(item ? item.isVeg : true);
  const [isAvailable, setIsAvailable] = useState(item ? item.isAvailable : true);
  const [prepTime, setPrepTime] = useState(item ? item.prepTime : 15);
  const [image, setImage] = useState(
    item
      ? item.image
      : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
  );
  const [customizations, setCustomizations] = useState(
    item && item.customizations
      ? item.customizations
      : [{ id: `c-${Date.now()}`, name: "Extra Cheese", price: 50 }]
  );

  const sampleImages = [
    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
  ];

  const handleAddCustomization = () => {
    setCustomizations([
      ...customizations,
      { id: `c-${Date.now()}`, name: "", price: 0 }
    ]);
  };

  const handleRemoveCustomization = (id) => {
    setCustomizations(customizations.filter((c) => c.id !== id));
  };

  const handleCustomizationChange = (id, field, val) => {
    setCustomizations(
      customizations.map((c) =>
        c.id === id ? { ...c, [field]: field === "price" ? parseFloat(val) || 0 : val } : c
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price) {
      alert("Please enter item name and price.");
      return;
    }

    const payload = {
      categoryId,
      name,
      description,
      price: parseFloat(price),
      isVeg,
      isAvailable,
      prepTime: parseInt(prepTime) || 15,
      image,
      customizations: customizations.filter((c) => c.name.trim() !== "")
    };

    if (isEditing) {
      editMenuItem(item.id, payload);
    } else {
      addMenuItem(payload);
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content item-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Edit Menu Item" : "Add New Menu Item"}</h2>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body form-grid">
          {/* Item Name */}
          <div className="form-group span-2">
            <label>Item Title / Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Truffle Mushroom Pizza"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group span-2">
            <label>Description</label>
            <textarea
              rows={2}
              placeholder="Short appetizing description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Price & Prep Time */}
          <div className="form-group">
            <label>Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              placeholder="350"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Prep Time (minutes)</label>
            <input
              type="number"
              min="1"
              placeholder="15"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </div>

          {/* Dietary Type & Availability */}
          <div className="form-group">
            <label>Dietary Type</label>
            <div className="radio-pill-group">
              <button
                type="button"
                className={`radio-pill veg ${isVeg ? "active" : ""}`}
                onClick={() => setIsVeg(true)}
              >
                Veg
              </button>
              <button
                type="button"
                className={`radio-pill nonveg ${!isVeg ? "active" : ""}`}
                onClick={() => setIsVeg(false)}
              >
                Non-Veg
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Stock Availability</label>
            <div className="toggle-switch-field">
              <input
                type="checkbox"
                id="avail-switch"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <label htmlFor="avail-switch" className="switch-label">
                {isAvailable ? "In Stock (Available)" : "Out of Stock"}
              </label>
            </div>
          </div>

          {/* Image Selection */}
          <div className="form-group span-2">
            <label>Image URL / Quick Presets</label>
            <input
              type="text"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            <div className="image-presets-row">
              {sampleImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="preset"
                  className={`preset-thumb ${image === img ? "selected" : ""}`}
                  onClick={() => setImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Dynamic Customizations Builder */}
          <div className="form-group span-2 customizations-builder">
            <div className="builder-header">
              <label>Customizations & Add-ons</label>
              <button
                type="button"
                className="btn-add-cust-field"
                onClick={handleAddCustomization}
              >
                <Plus size={14} /> Add Customization
              </button>
            </div>

            <div className="cust-rows-list">
              {customizations.length === 0 ? (
                <small className="no-cust-text">No add-ons defined for this item.</small>
              ) : (
                customizations.map((c) => (
                  <div key={c.id} className="cust-input-row">
                    <input
                      type="text"
                      placeholder="Add-on Name (e.g. Extra Cheese)"
                      value={c.name}
                      onChange={(e) =>
                        handleCustomizationChange(c.id, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Price (+₹)"
                      value={c.price}
                      onChange={(e) =>
                        handleCustomizationChange(c.id, "price", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn-del-cust"
                      onClick={() => handleRemoveCustomization(c.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer span-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <Check size={16} /> Save Menu Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
