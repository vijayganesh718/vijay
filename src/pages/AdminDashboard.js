import React, { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import { getAdminStats, getAdminTenants, toggleTenantStatus } from "../api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        getAdminStats(),
        getAdminTenants()
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (tenantId) => {
    try {
      await toggleTenantStatus(tenantId);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to toggle tenant status");
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNavbar />
        <div className="page-container">
          <h1>Super Admin Dashboard</h1>
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar />
      <div className="page-container">
        <h1>Super Admin Dashboard</h1>

        {error && <p className="error-msg">{error}</p>}

        {/* Stats Overview */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
            <div className="report-stat-card">
              <div className="report-stat-label">Total Shops</div>
              <div className="report-stat-value">{stats.total_tenants}</div>
            </div>
            <div className="report-stat-card">
              <div className="report-stat-label">Total Invoices</div>
              <div className="report-stat-value">{stats.total_invoices}</div>
            </div>
            <div className="report-stat-card">
              <div className="report-stat-label">Total Revenue</div>
              <div className="report-stat-value" style={{ color: "#2ecc71", fontSize: "1.4rem" }}>₹{stats.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="report-stat-card">
              <div className="report-stat-label">Total Products</div>
              <div className="report-stat-value">{stats.total_products}</div>
            </div>
            <div className="report-stat-card">
              <div className="report-stat-label">Total Customers</div>
              <div className="report-stat-value">{stats.total_customers}</div>
            </div>
          </div>
        )}

        {/* Tenants Table */}
        <div className="card">
          <h3>📋 All Registered Shops</h3>

          {tenants.length === 0 ? (
            <p className="empty-msg">No shops registered yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Shop Name</th>
                  <th>Owner Email</th>
                  <th>Products</th>
                  <th>Customers</th>
                  <th>Invoices</th>
                  <th>Revenue (₹)</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td><strong>{t.name}</strong></td>
                    <td>{t.owner_email}</td>
                    <td>{t.total_products}</td>
                    <td>{t.total_customers}</td>
                    <td>{t.total_invoices}</td>
                    <td>₹{t.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{t.created_at}</td>
                    <td>
                      {t.is_active ? (
                        <span className="badge-success">Active</span>
                      ) : (
                        <span className="badge-danger">Suspended</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(t.id)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          background: t.is_active ? "rgba(255, 43, 43, 0.15)" : "rgba(46, 204, 113, 0.15)",
                          color: t.is_active ? "var(--primary-red)" : "#2ecc71",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {t.is_active ? "Suspend" : "Activate"}
                      </button>
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

export default AdminDashboard;
