import React from "react";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">Super <span>Admin</span></div>
      <div className="nav-links">
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
