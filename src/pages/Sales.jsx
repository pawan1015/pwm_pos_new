import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import QuantityDialog from "./QuantityDialog";

export default function Sales() {
  const [cartItems, setCartItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState("");

  // QuantityDialog state
  const [pendingProduct, setPendingProduct] = useState(null); // product awaiting qty

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

  // ─── Suggestion scoring ───────────────────────────────────────────────────
  // Returns a score: lower = better match
  // 0 = exact match on code/barcode
  // 1 = starts-with match on code/barcode
  // 2 = starts-with match on name
  // 3 = contains match on code/barcode
  // 4 = contains match on name
  const scoreMatch = (item, query) => {
    const q = query.toLowerCase();
    const code = (item.code || "").toLowerCase();
    const barcode = (item.barcode || "").toLowerCase();
    const name = (item.name || "").toLowerCase();

    if (code === q ) return 0;
    if (code.startsWith(q) ) return 1;
    if (name.startsWith(q)) return 2;
    if (code.includes(q)) return 3;
    if (name.includes(q)) return 4;
    return 99; // no match
  };

  // Filter + sort suggestions based on match quality
  useEffect(() => {
    if (searchCode.trim() === "") {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }
    const query = searchCode.trim();

    const scored = inventory
      .map(item => ({ item, score: scoreMatch(item, query) }))
      .filter(({ score }) => score < 99)
      .sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name))
      .slice(0, 8)
      .map(({ item }) => item);

    setSuggestions(scored);
    setSelectedSuggestionIndex(-1);
  }, [searchCode, inventory]);

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (
      selectedSuggestionIndex >= 0 &&
      suggestionRefs.current[selectedSuggestionIndex]
    ) {
      suggestionRefs.current[selectedSuggestionIndex].scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedSuggestionIndex]);

  // ─── Open quantity dialog for a product ───────────────────────────────────
  const openQtyDialog = (product) => {
    setSearchCode(product.code || product.barcode || "");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setError("");
    setPendingProduct(product);
  };

  // ─── Keyboard navigation on search input ─────────────────────────────────
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
          openQtyDialog(suggestions[selectedSuggestionIndex]);
        } else if (suggestions.length > 0) {
          openQtyDialog(suggestions[0]);
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

  // Manual search (exact match)
  const handleSearch = () => {
    setError("");
    if (!searchCode.trim()) {
      setError("Please enter a product code.");
      return;
    }
    const product = inventory.find(
      item =>
        item.code?.toLowerCase() === searchCode.trim().toLowerCase() 
        
    );
    if (product) {
      openQtyDialog(product);
    } else {
      setError(`Product with code "${searchCode}" not found.`);
    }
  };

  // ─── QuantityDialog callbacks ─────────────────────────────────────────────
  const handleQtyConfirm = (qty) => {
    if (!pendingProduct) return;

    const newItem = {
      id: Date.now(),
      name: pendingProduct.name,
      price: pendingProduct.sellingPrice,
      quantity: qty,
    };
    setCartItems(prev => [...prev, newItem]);

    setPendingProduct(null);
    setSearchCode("");
    setSuggestions([]);
    setError("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleQtyCancel = () => {
    setPendingProduct(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // ─── Cart helpers ─────────────────────────────────────────────────────────
  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
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
            placeholder="Type product code or scan barcode"
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
                  ref={el => (suggestionRefs.current[idx] = el)}
                  className={idx === selectedSuggestionIndex ? "selected" : ""}
                  onClick={() => openQtyDialog(item)}
                  onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                >
                  <strong>{item.code}</strong>
                  {" — "}
                  {item.name}
                  <span className="suggestion-price">
                    LKR {item.sellingPrice.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {/* Cart table */}
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
          {cartItems.map(item => (
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
          <p>No items added. Search for a product using its code, barcode, or name.</p>
        </div>
      )}

      <div className="sales-summary">
        <h3>Total: LKR {total.toFixed(2)}</h3>
        <button className="btn-checkout" disabled={cartItems.length === 0}>
          Checkout
        </button>
      </div>

      {/* Quantity Dialog */}
      <QuantityDialog
        product={pendingProduct}
        onConfirm={handleQtyConfirm}
        onCancel={handleQtyCancel}
      />
    </div>
  );
}
