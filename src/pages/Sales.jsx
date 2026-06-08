import { useState } from "react";

export default function Sales() {
  const [cartItems, setCartItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("");

  const addItem = () => {
    if (itemName && itemPrice && itemQty) {
      const newItem = {
        id: Date.now(),
        name: itemName,
        price: parseFloat(itemPrice),
        quantity: parseInt(itemQty),
      };
      setCartItems([...cartItems, newItem]);
      setItemName("");
      setItemPrice("");
      setItemQty("");
    }
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="page-container">
      <h2>Sales</h2>

      <div className="sales-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            placeholder="Price"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            placeholder="Quantity"
            value={itemQty}
            onChange={(e) => setItemQty(e.target.value)}
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
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
              <td>
                <button
                  className="btn-remove"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sales-summary">
        <h3>Total: ${total.toFixed(2)}</h3>
        <button className="btn-checkout" disabled={cartItems.length === 0}>
          Checkout
        </button>
      </div>
    </div>
  );
}
