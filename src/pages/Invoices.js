import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { getCustomers, createInvoice } from "../api";

const Invoices = () => {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data)).catch(() => setError("Failed to load customers"));
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCustomerId("");
    setShowSuggestions(true);
  };

  const handleSelectCustomer = (c) => {
    setCustomerId(c.id);
    setSearchQuery(`${c.name} (${c.phone || "No Phone"}) (ID: ${c.id})`);
    setShowSuggestions(false);
  };

  const handleCreate = async () => {
    setError(""); setCreated(null);
    if (!customerId) { setError("Please search and select a customer"); return; }
    try {
      const res = await createInvoice({ customer_id: parseInt(customerId) });
      setCreated(res.data);
      setSearchQuery("");
      setCustomerId("");
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
            <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search customer by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if (searchQuery) setShowSuggestions(true); }}
                className="input"
                style={{ width: "100%" }}
                autoComplete="off"
              />
              {showSuggestions && searchQuery && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--card-bg, #1e1e2f)",
                  border: "1px solid var(--border-color, #333)",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{ padding: "10px 14px", color: "#888" }}>No customers found</div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border-color, #333)",
                          transition: "background 0.15s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <strong>{c.name}</strong>
                        <span style={{ color: "#aaa", marginLeft: "8px" }}>
                          ({c.phone || "No Phone"}) (ID: {c.id})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button onClick={handleCreate} className="btn-primary">Create Invoice</button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        {!created && (
          <div className="helper-steps">
            <h3>📖 How to Create an Invoice</h3>
            <div className="helper-step">
              <div className="step-number">1</div>
              <div className="step-text">Type the <strong>customer's name</strong> in the search box above. A dropdown will appear with matching customers.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">2</div>
              <div className="step-text"><strong>Click on the customer</strong> from the dropdown to select them.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">3</div>
              <div className="step-text">Click the <strong>"Create Invoice"</strong> button. A new invoice will be generated.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">4</div>
              <div className="step-text"><strong>Note down the Invoice ID</strong> — you'll need it to add products in the <strong>Add Items</strong> page.</div>
            </div>
          </div>
        )}

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