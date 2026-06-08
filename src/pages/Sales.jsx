import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Sales() {
  const [cartItems, setCartItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [error, setError] = useState("");
  const searchInputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // Load inventory from backend
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const result = await invoke("get_items");
      const items = result.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        barcode: item.barcode,
        sellingPrice: Number(item.sellingPrice || item.selling_price || 0),
        buyingPrice: Number(item.buyingPrice || item.buying_price || 0),
        discount: Number(item.discount || 0),
        discountType: item.discountType || item.discount_type || "percentage",
        category: item.category,
      }));
      setInventory(items);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError("Could not load products. Please try again.");
    }
  };

  // Filter suggestions based on code or barcode (case-insensitive)
  useEffect(() => {
    if (searchCode.trim() === "") {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }
    const query = searchCode.trim().toLowerCase();
    const matches = inventory.filter(item =>
      item.code?.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    ).slice(0, 8); // limit to 8 suggestions
    setSuggestions(matches);
    setSelectedSuggestionIndex(-1);
  }, [searchCode, inventory]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          selectProduct(suggestions[selectedSuggestionIndex]);
        } else if (suggestions.length > 0) {
          // If no item is highlighted, select the first one
          selectProduct(suggestions[0]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Select a product from suggestions
  const selectProduct = (product) => {
    setItemName(product.name);
    setItemPrice(product.sellingPrice.toString());
    setSearchCode(product.code || product.barcode); // Show the selected code in input
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setError("");
    // Focus on quantity input after selection (optional)
    document.getElementById("sales-qty")?.focus();
  };

  // Manual search when button is clicked or Enter without suggestions
  const handleSearch = () => {
    setError("");
    if (!searchCode.trim()) {
      setError("Please enter a product code or barcode.");
      return;
    }
    const product = inventory.find(item =>
      item.code?.toLowerCase() === searchCode.trim().toLowerCase() ||
      item.barcode?.toLowerCase() === searchCode.trim().toLowerCase()
    );
    if (product) {
      selectProduct(product);
    } else {
      setError(`Product with code/barcode "${searchCode}" not found.`);
      setItemName("");
      setItemPrice("");
    }
  };

  const addItem = () => {
    if (!itemName || !itemPrice || !itemQty) {
      setError("Please fill in all fields (name, price, quantity).");
      return;
    }
    const priceNum = parseFloat(itemPrice);
    const qtyNum = parseInt(itemQty);
    if (isNaN(priceNum) || isNaN(qtyNum) || priceNum <= 0 || qtyNum <= 0) {
      setError("Invalid price or quantity.");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: itemName,
      price: priceNum,
      quantity: qtyNum,
    };
    setCartItems([...cartItems, newItem]);

    // Reset form but keep last used code? Better to clear for next scan.
    setItemName("");
    setItemPrice("");
    setItemQty("1");
    setSearchCode("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setError("");
    searchInputRef.current?.focus();
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="page-container">
      <h2>Sales</h2>

      {/* Search with autocomplete */}
      <div className="sales-search">
        <div className="form-group" style={{ flex: 2, position: "relative" }}>
          <label>Product Code / Barcode</label>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Type or scan code/barcode"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map((item, idx) => (
                <li
                  key={item.id}
                  ref={el => suggestionRefs.current[idx] = el}
                  className={idx === selectedSuggestionIndex ? "selected" : ""}
                  onClick={() => selectProduct(item)}
                  onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                >
                  <strong>{item.code}</strong> {item.barcode && `(${item.barcode})`} - {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn-find" onClick={handleSearch}>
          Find
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="sales-form">
        <div className="form-group">
          <label>Item Name</label>
          <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Selling Price (LKR)</label>
          <input
            type="number"
            placeholder="Price"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            id="sales-qty"
            type="number"
            placeholder="Quantity"
            value={itemQty}
            onChange={(e) => setItemQty(e.target.value)}
            min="1"
          />
        </div>
        <button className="btn-add" onClick={addItem}>
          Add Item
        </button>
      </div>

      <table className="cart-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price (LKR)</th>
            <th>Qty</th>
            <th>Total (LKR)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>{(item.price * item.quantity).toFixed(2)}</td>
              <td>
                <button className="btn-remove" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cartItems.length === 0 && (
        <div className="empty-state">
          <p>No items added. Search for a product using its code or barcode.</p>
        </div>
      )}

      <div className="sales-summary">
        <h3>Total: LKR {total.toFixed(2)}</h3>
        <button className="btn-checkout" disabled={cartItems.length === 0}>
          Checkout
        </button>
      </div>
    </div>
  );
}