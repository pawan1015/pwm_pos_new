import { useState } from "react";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("sales");
  // 👇 cart state lifted up from Sales
  const [cartItems, setCartItems] = useState([]);

  // Compute total from cart items
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="app-container">
      <header className="header">
        <h1>POS System</h1>

        {/* ✅ Dynamic total display */}
        <div className="header-total">
          <h1>Total:</h1>
          <h1 >LKR {total.toFixed(2)}</h1>
        </div>

        <select
          className="page-selector"
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
        >
          <option value="sales">Sales (POS)</option>
          <option value="inventory">Inventory</option>
        </select>
      </header>

      <div className="page-content">
        {currentPage === "sales" && (
          <Sales cartItems={cartItems} setCartItems={setCartItems} />
        )}
        {currentPage === "inventory" && <Inventory />}
      </div>
    </main>
  );
}

export default App;