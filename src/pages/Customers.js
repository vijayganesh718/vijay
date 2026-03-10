import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCustomers, createCustomer } from "../api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
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
    if (form.phone && !/^\d{10}$/.test(form.phone)) { setError("Phone number must be exactly 10 digits"); return; }
    if (form.email && !form.email.includes("@gmail.com")) { setError("Email must be a @gmail.com address"); return; }
    try {
      await createCustomer(form);
      setSuccess("Customer added!");
      setForm({ name: "", phone: "", email: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add customer");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Customers</h1>

        <div className="card">
          <h3>Add New Customer</h3>
          <div className="form-row">
            <input placeholder="Customer Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            <button onClick={handleSubmit} className="btn-primary">Add Customer</button>
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
                <tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.email || "—"}</td>
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