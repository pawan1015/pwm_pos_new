import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

// Generate unique barcode
const generateBarcode = () => {
  return "BC" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};

export default function Inventory() {
  const [inventory, setInventory] = useState([
    {
      id: 1,
      name: "Product A",
      code: "PRD001",
      buyingPrice: 10.0,
      sellingPrice: 19.99,
      discount: 0,
      discountType: "percentage",
      category: "Electronics",
      barcode: "BC1700000001ABC123",
    },
    {
      id: 2,
      name: "Product B",
      code: "PRD002",
      buyingPrice: 15.0,
      sellingPrice: 29.99,
      discount: 0,
      discountType: "percentage",
      category: "Clothing",
      barcode: "BC1700000002DEF456",
    },
  ]);

  const [categories, setCategories] = useState([
    "Electronics",
    "Clothing",
    "Food",
    "Books",
    "Furniture",
    "Other",
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    buyingPrice: "",
    sellingPrice: "",
    discount: "",
    discountType: "percentage",
    category: "",
    barcode: generateBarcode(),
  });

  // Load categories from database on mount
  useEffect(() => {
    loadCategories();
    loadItems();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await invoke("get_categories");
      if (result && result.length > 0) {
        const categoryNames = result.map((cat) => cat.name);
        setCategories(categoryNames);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

const loadItems = async () => {
  try {
    const result = await invoke("get_items");

    const formattedItems = result.map(item => ({
      ...item,
      buyingPrice: Number(item.buyingPrice || item.buying_price || 0),
      sellingPrice: Number(item.sellingPrice || item.selling_price || 0),
      discount: Number(item.discount || 0),
    }));

    setInventory(formattedItems);
  } catch (err) {
    console.error("Failed to load items:", err);
  }
};

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("Please enter a category name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await invoke("add_category", { name: newCategoryName });
      await loadCategories();
      setNewCategoryName("");
      setShowCategoryModal(false);
    } catch (err) {
      setError(err?.toString?.() || "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "discountType") {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleGenerateBarcode = () => {
    setFormData({ ...formData, barcode: generateBarcode() });
  };

  const openAddItemModal = () => {
    setFormData({
      name: "",
      code: "",
      buyingPrice: "",
      sellingPrice: "",
      discount: "",
      discountType: "percentage",
      category: "",
      barcode: generateBarcode(),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryName("");
    setError("");
  };

  const addProduct = async () => {
    if (
      formData.name &&
      formData.code &&
      formData.buyingPrice &&
      formData.sellingPrice &&
      formData.category
    ) {
      setItemLoading(true);
      setItemError("");

      try {
        await invoke("add_item", {
          name: formData.name,
          code: formData.code,
          buyingPrice: parseFloat(formData.buyingPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          discount: formData.discount ? parseFloat(formData.discount) : 0,
          discountType: formData.discountType,
          category: formData.category,
          barcode: formData.barcode,
        });

        const newProduct = {
          id: Date.now(),
          name: formData.name,
          code: formData.code,
          buyingPrice: parseFloat(formData.buyingPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          discount: formData.discount ? parseFloat(formData.discount) : 0,
          discountType: formData.discountType,
          category: formData.category,
          barcode: formData.barcode,
        };
        setInventory([...inventory, newProduct]);
        closeModal();
      } catch (err) {
        setItemError(err?.toString?.() || "Failed to save item");
      } finally {
        setItemLoading(false);
      }
    } else {
      alert("Please fill all required fields");
    }
  };

  const deleteProduct = (id) => {
    setInventory(inventory.filter((item) => item.id !== id));
  };

  const filteredInventory =
    selectedCategory === ""
      ? inventory
      : inventory.filter((item) => item.category === selectedCategory);

  return (
    <div className="page-container">
      <h2>Inventory</h2>

      <div className="inventory-controls">
        <div className="control-group">
          <div className="category-filter">
            <label htmlFor="category-select">Filter by Category:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-add-category"
            onClick={() => setShowCategoryModal(true)}
            title="Add new category"
          >
            + Category
          </button>
        </div>

        <button className="btn-add-product" onClick={openAddItemModal}>
          + Add Item
        </button>
      </div>

      {/* Add Category Modal Dialog */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Category</h3>
              <button className="modal-close" onClick={closeCategoryModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  placeholder="Enter category name (e.g., Electronics)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory();
                    }
                  }}
                  autoFocus
                />
              </div>

              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={closeCategoryModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAddCategory}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal Dialog */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Item</h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Product Code *</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g., PRD001"
                    value={formData.code}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Buying Price *</label>
                  <input
                    type="number"
                    name="buyingPrice"
                    placeholder="0.00"
                    value={formData.buyingPrice}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount</label>
                  <div className="discount-group">
                    <input
                      type="number"
                      name="discount"
                      placeholder="0"
                      value={formData.discount}
                      onChange={handleInputChange}
                      step="0.01"
                    />
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="discount-type-select"
                    >
                      <option value="percentage">%</option>
                      <option value="value">Fixed ($)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Barcode (Auto-generated)</label>
                <div className="barcode-group">
                  <input
                    type="text"
                    value={formData.barcode}
                    readOnly
                    className="barcode-input"
                  />
                  <button
                    type="button"
                    className="btn-regenerate"
                    onClick={handleGenerateBarcode}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {itemError && <div className="error-message">{itemError}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal} disabled={itemLoading}>
                Cancel
              </button>
              <button className="btn-save" onClick={addProduct} disabled={itemLoading}>
                {itemLoading ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Code</th>
            <th>Category</th>
            <th>Buying Price</th>
            <th>Selling Price</th>
            <th>Discount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item) => (
            <tr key={item.id}>
            
              <td>{item.name}</td>
              <td>{item.code}</td>
              <td>
                <span className="category-badge">{item.category}</span>
              </td>
              <td>${item.buyingPrice.toFixed(2)}</td>
              <td>${item.sellingPrice.toFixed(2)}</td>
              <td>
                {item.discount > 0 ? (
                  <span className="discount-badge">
                    {item.discount}
                    {item.discountType === "percentage" ? "%" : "$"}
                  </span>
                ) : (
                  <span>-</span>
                )}
              </td>
              <td>
                <button
                  className="btn-delete"
                  onClick={() => deleteProduct(item.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredInventory.length === 0 && (
        <div className="empty-state">
          <p>No items found. Add your first item to get started!</p>
        </div>
      )}
    </div>
  );
}
