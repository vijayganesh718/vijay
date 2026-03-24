import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getProducts, createProduct, updateProduct } from "../api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "", gst_rate: "0", expiry_date: "" });
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
        await updateProduct(parseInt(editingId), { name: form.name, price: parseFloat(String(form.price).replace(/,/g, '')), stock: parseInt(form.stock), gst_rate: parseFloat(form.gst_rate), expiry_date: form.expiry_date || null });
        setSuccess("Product updated successfully!");
        setEditingId(null);
      } else {
        await createProduct({ name: form.name, price: parseFloat(String(form.price).replace(/,/g, '')), stock: parseInt(form.stock), gst_rate: parseFloat(form.gst_rate), expiry_date: form.expiry_date || null });
        setSuccess("Product added successfully!");
      }
      setForm({ name: "", price: "", stock: "", gst_rate: "0", expiry_date: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save product");
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, price: p.price, stock: p.stock, gst_rate: p.gst_rate || "0", expiry_date: p.expiry_date || "" });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm({ name: "", price: "", stock: "", gst_rate: "0", expiry_date: "" });
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
            <select value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} className="input" style={{ maxWidth: "140px" }}>
              <option value="0">GST 0%</option>
              <option value="5">GST 5%</option>
              <option value="12">GST 12%</option>
              <option value="18">GST 18%</option>
              <option value="28">GST 28%</option>
              <option value="40">GST 40%</option>
            </select>
            <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input" style={{ maxWidth: "170px" }} title="Expiry Date" />
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
                <tr><th>ID</th><th>Name</th><th>Price (₹)</th><th>GST %</th><th>Stock</th><th>Expiry</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const expiry = p.expiry_date ? new Date(p.expiry_date) : null;
                  const daysLeft = expiry ? Math.ceil((expiry - today) / (1000*60*60*24)) : null;
                  let expiryColor = "var(--text-muted)";
                  let expiryLabel = p.expiry_date || "—";
                  if (daysLeft !== null) {
                    if (daysLeft < 0) { expiryColor = "#e74c3c"; expiryLabel = `Expired`; }
                    else if (daysLeft <= 30) { expiryColor = "#e67e22"; expiryLabel = `${daysLeft}d left`; }
                    else { expiryLabel = p.expiry_date; }
                  }
                  return (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>₹{parseFloat(p.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>{parseFloat(p.gst_rate || 0)}%</td>
                    <td><span className={p.stock < 5 ? "badge-danger" : "badge-success"}>{p.stock}</span></td>
                    <td style={{ color: expiryColor, fontWeight: daysLeft !== null && daysLeft <= 30 ? "700" : "400" }}>{expiryLabel}</td>
                    <td>
                      <button onClick={() => handleEdit(p)} style={{ padding: "5px 10px", fontSize: "0.85rem", backgroundColor: "var(--primary-red)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Edit</button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;