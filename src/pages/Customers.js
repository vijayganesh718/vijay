import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCustomers, createCustomer, updateCustomer } from "../api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch {
      setError("Failed to load customers");
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.name) { setError("Customer name is required"); return; }
    if (!form.phone || !/^\d{10}$/.test(form.phone)) { setError("Phone number is required and must be exactly 10 digits"); return; }
    if (form.email && !form.email.includes("@gmail.com")) { setError("Email must be a @gmail.com address"); return; }
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
        setSuccess("Customer updated successfully!");
        setEditingId(null);
      } else {
        await createCustomer(form);
        setSuccess("Customer added!");
      }
      setForm({ name: "", phone: "", email: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save customer");
    }
  };

  const handleEdit = (c) => {
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "" });
    setEditingId(c.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm({ name: "", phone: "", email: "" });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Customers</h1>

        <div className="card">
          <h3>{editingId ? "Edit Customer" : "Add New Customer"}</h3>
          <div className="form-row">
            <input placeholder="Customer Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            <input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            <button onClick={handleSubmit} className="btn-primary" style={{ marginRight: '10px' }}>{editingId ? "Update Customer" : "Add Customer"}</button>
            {editingId && <button onClick={handleCancelEdit} className="btn-secondary">Cancel</button>}
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
        </div>

        <div className="card">
          <h3>Customer List</h3>
          {customers.length === 0 ? (
            <p className="empty-msg">No customers yet. Add one above!</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>
                      <button onClick={() => handleEdit(c)} style={{ padding: "5px 10px", fontSize: "0.85rem", backgroundColor: "var(--primary-red)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Edit</button>
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

export default Customers;