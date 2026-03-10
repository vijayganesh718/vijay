import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

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
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;