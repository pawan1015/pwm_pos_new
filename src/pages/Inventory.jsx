import { useState } from "react";

export default function Inventory() {
  const [inventory, setInventory] = useState([
    { id: 1, name: "Product A", sku: "SKU001", quantity: 50, price: 19.99 },
    { id: 2, name: "Product B", sku: "SKU002", quantity: 30, price: 29.99 },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantity: "",
    price: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addProduct = () => {
    if (formData.name && formData.sku && formData.quantity && formData.price) {
      const newProduct = {
        id: Date.now(),
        name: formData.name,
        sku: formData.sku,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
      };
      setInventory([...inventory, newProduct]);
      setFormData({ name: "", sku: "", quantity: "", price: "" });
      setShowForm(false);
    }
  };

  const deleteProduct = (id) => {
    setInventory(inventory.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    setInventory(
      inventory.map((item) =>
        item.id === id ? { ...item, quantity: parseInt(newQty) } : item
      )
    );
  };

  return (
    <div className="page-container">
      <h2>Inventory</h2>

      <button
        className="btn-add-product"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Add Product"}
      </button>

      {showForm && (
        <div className="inventory-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="sku"
              placeholder="SKU"
              value={formData.sku}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleInputChange}
            />
          </div>
          <button className="btn-save" onClick={addProduct}>
            Save Product
          </button>
        </div>
      )}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.sku}</td>
              <td>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, e.target.value)}
                  className="qty-input"
                />
              </td>
              <td>${item.price.toFixed(2)}</td>
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
    </div>
  );
}
