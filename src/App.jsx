import { useState } from "react";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("sales");

  return (
    <main className="app-container">
      <div className="header">
        <h1>POS System</h1>
        <select
          className="page-selector"
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
        >
          <option value="sales">Sales</option>
          <option value="inventory">Inventory</option>
        </select>
      </div>

      <div className="page-content">
        {currentPage === "sales" && <Sales />}
        {currentPage === "inventory" && <Inventory />}
      </div>
    </main>
  );
}

export default App;
