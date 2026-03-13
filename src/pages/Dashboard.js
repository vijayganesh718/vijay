import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const role = localStorage.getItem("role");
  const tenantId = localStorage.getItem("tenant_id");

  const cards = [
    { title: "Products", desc: "Manage your product catalog", icon: "📦", link: "/products" },
    { title: "Customers", desc: "View and add customers", icon: "👥", link: "/customers" },
    { title: "Invoices", desc: "Create new invoices", icon: "🧾", link: "/invoices" },
    { title: "Invoice Items", desc: "Add products to invoices", icon: "➕", link: "/invoice-items" },
    { title: "View Bill", desc: "View and download invoices as PDF", icon: "📄", link: "/bill" },
    { title: "Bill History", desc: "View all past bills", icon: "📋", link: "/bill-history" },
    { title: "Sales Reports", desc: "Generate daily & monthly sales reports", icon: "📊", link: "/reports" },
    { title: "Sales Graph", desc: "Visual charts for recent sales", icon: "📈", link: "/sales-graph" },
  ];

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="badge">Tenant ID: {tenantId} | Role: {role}</div>
        </div>
        <div className="dashboard-grid">
          {cards.map((c) => (
            <Link to={c.link} key={c.title} className="dashboard-card">
              <div className="card-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;