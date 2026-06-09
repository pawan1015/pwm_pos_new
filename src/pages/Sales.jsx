import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import QuantityDialog from "../components/QuantityDialog";
import BillPreview from "../components/BillPreview";

export default function Sales({ cartItems, setCartItems }) {
  const [inventory, setInventory] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showBill, setShowBill] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  const [pendingProduct, setPendingProduct] = useState(null);
  const searchInputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // Load inventory
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

  // Suggestion scoring
  const scoreMatch = (item, query) => {
    const q = query.toLowerCase();
    const code = (item.code || "").toLowerCase();
    const barcode = (item.barcode || "").toLowerCase();
    const name = (item.name || "").toLowerCase();

    if (code === q) return 0;
    if (code.startsWith(q)) return 1;
    if (name.startsWith(q)) return 2;
    if (code.includes(q)) return 3;
    if (name.includes(q)) return 4;
    return 99;
  };

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

  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionRefs.current[selectedSuggestionIndex]) {
      suggestionRefs.current[selectedSuggestionIndex].scrollIntoView({ block: "nearest" });
    }
  }, [selectedSuggestionIndex]);

  const openQtyDialog = (product) => {
    setSearchCode(product.code || product.barcode || "");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setError("");
    setPendingProduct(product);
  };

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
        setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
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

  const handleSearch = () => {
    setError("");
    if (!searchCode.trim()) {
      setError("Please enter a product code.");
      return;
    }
    const product = inventory.find(
      item => item.code?.toLowerCase() === searchCode.trim().toLowerCase()
    );
    if (product) {
      openQtyDialog(product);
    } else {
      setError(`Product with code "${searchCode}" not found.`);
    }
  };

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

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    const invoiceNo = `INV-${Date.now()}`;
    setLastInvoice({
      invoice: invoiceNo,
      items: [...cartItems],
      subtotal,
      discount,
      total,
      cashier: "Default Cashier",
    });
    setShowBill(true);
    setCartItems([]);
    setDiscount(0);
  };

  const handleNewSale = () => {
    setShowBill(false);
    setLastInvoice(null);
    setDiscount(0);
    setSearchCode("");
    setError("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  return (
    <div className="page-container">
      <h2>Sales</h2>

      <div className="sales-search">
        <div className="form-group" style={{ width: "1%", flex: 2, position: "relative" }}>
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
                  <strong>{item.code}</strong> — {item.name}
                  <span className="suggestion-price">LKR {item.sellingPrice.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

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
                <button className="btn-remove" onClick={() => removeItem(item.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cartItems.length === 0 && !showBill && (
        <div className="empty-state">
          <p>No items added. Search for a product using its code, barcode, or name.</p>
        </div>
      )}

      <div className="sales-summary">
        <div className="discount-input" style={{ marginBottom: "10px" }}>
          <label>Discount (LKR): </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            min="0"
            step="10"
          />
        </div>
        <h3>Subtotal: LKR {subtotal.toFixed(2)}</h3>
        <h3>Total: LKR {total.toFixed(2)}</h3>
        <button className="btn-checkout" onClick={handleCheckout} disabled={cartItems.length === 0}>
          Checkout
        </button>
        {showBill && (
          <button className="btn-new-sale" onClick={handleNewSale} style={{ marginLeft: "10px" }}>
            New Sale
          </button>
        )}
      </div>

      {showBill && lastInvoice && (
        <BillPreview
          invoice={lastInvoice.invoice}
          cartItems={lastInvoice.items}
          subtotal={lastInvoice.subtotal}
          discount={lastInvoice.discount}
          total={lastInvoice.total}
          cashier={lastInvoice.cashier}
        />
      )}

      <QuantityDialog product={pendingProduct} onConfirm={handleQtyConfirm} onCancel={handleQtyCancel} />
    </div>
  );
}