import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCustomers, createInvoice } from "../api";

const Invoices = () => {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data)).catch(() => setError("Failed to load customers"));
  }, []);

  const handleCreate = async () => {
    setError(""); setCreated(null);
    if (!customerId) { setError("Please select a customer"); return; }
    try {
      const res = await createInvoice({ customer_id: parseInt(customerId) });
      setCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create invoice");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Create Invoice</h1>

        <div className="card">
          <h3>New Invoice</h3>
          <div className="form-row">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input">
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
              ))}
            </select>
            <button onClick={handleCreate} className="btn-primary">Create Invoice</button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        {created && (
          <div className="card success-card">
            <h3>✅ Invoice Created!</h3>
            <div className="invoice-details">
              <div className="invoice-detail-row"><span>Invoice ID:</span><strong>#{created.invoice_id}</strong></div>
              <div className="invoice-detail-row"><span>Customer ID:</span><strong>{created.customer_id}</strong></div>
              <div className="invoice-detail-row"><span>Total:</span><strong>₹{parseFloat(created.total).toFixed(2)}</strong></div>
            </div>
            <p className="hint">📌 Note the Invoice ID: <strong>{created.invoice_id}</strong> — use it to add items.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;