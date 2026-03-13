import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getProducts, addInvoiceItem } from "../api";

const InvoiceItems = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ invoice_id: "", product_id: "", quantity: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts().then((res) => setProducts(res.data)).catch(() => setError("Failed to load products"));
  }, []);

  const handleSubmit = async () => {
    setError(""); setResult(null);
    if (!form.invoice_id || !form.product_id || !form.quantity) { setError("All fields are required"); return; }
    try {
      const res = await addInvoiceItem({
        invoice_id: parseInt(form.invoice_id),
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add item");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Add Invoice Items</h1>

        <div className="card">
          <h3>Add Product to Invoice</h3>
          <div className="form-row">
            <input placeholder="Invoice ID" type="number" value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} className="input" />
            <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="input">
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ₹{parseFloat(p.price).toFixed(2)} (Stock: {p.stock})</option>
              ))}
            </select>
            <input placeholder="Quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" />
            <button onClick={handleSubmit} className="btn-primary">Add Item</button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        {!result && (
          <div className="helper-steps">
            <h3>📖 How to Add Items to an Invoice</h3>
            <div className="helper-step">
              <div className="step-number">1</div>
              <div className="step-text">Enter the <strong>Invoice ID</strong> you received after creating an invoice.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">2</div>
              <div className="step-text"><strong>Select a product</strong> from the dropdown list. It shows the name, price, and available stock.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">3</div>
              <div className="step-text">Enter the <strong>quantity</strong> the customer wants to purchase.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">4</div>
              <div className="step-text">Click <strong>"Add Item"</strong>. You can repeat this to add more products to the same invoice.</div>
            </div>
          </div>
        )}

        {result && (
          <div className="card success-card">
            <h3>✅ Item Added!</h3>
            <div className="invoice-details">
              <div className="invoice-detail-row"><span>Invoice Item ID:</span><strong>#{result.invoice_item_id}</strong></div>
              <div className="invoice-detail-row"><span>Invoice ID:</span><strong>#{result.invoice_id}</strong></div>
              <div className="invoice-detail-row"><span>Product ID:</span><strong>{result.product_id}</strong></div>
              <div className="invoice-detail-row"><span>Quantity:</span><strong>{result.quantity}</strong></div>
              <div className="invoice-detail-row"><span>Line Total:</span><strong>₹{parseFloat(result.line_total).toFixed(2)}</strong></div>
              <div className="invoice-detail-row"><span>Invoice Total:</span><strong>₹{parseFloat(result.invoice_total).toFixed(2)}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceItems;