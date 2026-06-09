import { useState, useEffect, useRef } from "react";

/**
 * QuantityDialog
 * Props:
 *   product  – the selected product object (or null to hide)
 *   onConfirm(qty) – called when user confirms
 *   onCancel()     – called when user cancels / presses Escape
 */
export default function QuantityDialog({ product, onConfirm, onCancel }) {
  const [qty, setQty] = useState("1");
  const inputRef = useRef(null);

  // Reset qty and focus input each time dialog opens
  useEffect(() => {
    if (product) {
      setQty("1");
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [product]);

  if (!product) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const confirm = () => {
    const parsed = parseInt(qty, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    onConfirm(parsed);
  };

  return (
    /* Backdrop */
    <div
      className="qty-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="qty-dialog">
        {/* Header */}
        <div className="qty-dialog-header">
          <span className="qty-dialog-title">Set Quantity</span>
          <button className="qty-dialog-close" onClick={onCancel} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* Product info */}
        <div className="qty-dialog-product">
          <div className="qty-dialog-product-name">{product.name}</div>
          <div className="qty-dialog-product-meta">
            {product.code && <span className="qty-tag">#{product.code}</span>}
            <span className="qty-price">LKR {Number(product.sellingPrice).toFixed(2)}</span>
          </div>
        </div>

        {/* Quantity input */}
        <div className="qty-dialog-body">
          <label className="qty-label" htmlFor="qty-input">Quantity</label>
          <div className="qty-controls">
            <button
              className="qty-step"
              onClick={() => setQty(v => Math.max(1, parseInt(v || 1) - 1).toString())}
            >−</button>
            <input
              id="qty-input"
              ref={inputRef}
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={handleKeyDown}
              className="qty-input"
            />
            <button
              className="qty-step"
              onClick={() => setQty(v => (parseInt(v || 1) + 1).toString())}
            >+</button>
          </div>
          {product.sellingPrice > 0 && (
            <div className="qty-subtotal">
              Subtotal: <strong>LKR {(Number(product.sellingPrice) * (parseInt(qty) || 0)).toFixed(2)}</strong>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="qty-dialog-actions">
          <button className="qty-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="qty-btn-confirm" onClick={confirm}>
            Add to Cart ↵
          </button>
        </div>

        <div className="qty-dialog-hint">Press <kbd>Enter</kbd> to add · <kbd>Esc</kbd> to cancel</div>
      </div>
    </div>
  );
}
