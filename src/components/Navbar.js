import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLightMode, setIsLightMode] = useState(
    localStorage.getItem("theme") === "light"
  );

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
      setIsLightMode(false);
    } else {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
      setIsLightMode(true);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">Billing <span>System</span></div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/products">Products</Link>
        <Link to="/customers">Customers</Link>
        <Link to="/invoices">Invoices</Link>
        <Link to="/invoice-items">Add Items</Link>
        <Link to="/bill">View Bill</Link>
        <Link to="/bill-history">Bill History</Link>
        <Link to="/reports">Reports</Link>

        <button onClick={toggleTheme} className="theme-toggle" style={{
          background: "none",
          border: "none",
          fontSize: "1.2rem",
          cursor: "pointer",
          padding: "8px",
          marginLeft: "16px",
          marginRight: "16px"
        }}>
          {isLightMode ? "🌙" : "☀️"}
        </button>

        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;