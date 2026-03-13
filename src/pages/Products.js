import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getProducts, createProduct, updateProduct } from "../api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch {
      setError("Failed to load products");
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.name || !form.price || !form.stock) { setError("All fields are required"); return; }
    try {
      if (editingId) {
        await updateProduct(parseInt(editingId), { name: form.name, price: parseFloat(String(form.price).replace(/,/g, '')), stock: parseInt(form.stock) });
        setSuccess("Product updated successfully!");
        setEditingId(null);
      } else {
        await createProduct({ name: form.name, price: parseFloat(String(form.price).replace(/,/g, '')), stock: parseInt(form.stock) });
        setSuccess("Product added successfully!");
      }
      setForm({ name: "", price: "", stock: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save product");
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, price: p.price, stock: p.stock });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm({ name: "", price: "", stock: "" });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Products</h1>

        <div className="card">
          <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
          <div className="form-row">
            <input placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            <input placeholder="Price (₹)" type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
            <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" />
            <button onClick={handleSubmit} className="btn-primary" style={{ marginRight: '10px' }}>{editingId ? "Update Product" : "Add Product"}</button>
            {editingId && <button onClick={handleCancelEdit} className="btn-secondary">Cancel</button>}
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
        </div>

        <div className="card">
          <h3>Product List</h3>
          {products.length === 0 ? (
            <p className="empty-msg">No products found. Add one above!</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Price (₹)</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>₹{parseFloat(p.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td><span className={p.stock < 5 ? "badge-danger" : "badge-success"}>{p.stock}</span></td>
                    <td>
                      <button onClick={() => handleEdit(p)} style={{ padding: "5px 10px", fontSize: "0.85rem", backgroundColor: "var(--primary-red)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;