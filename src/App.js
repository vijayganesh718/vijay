import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import InvoiceItems from "./pages/InvoiceItems";
import BillView from "./pages/BillView";
import BillHistory from "./pages/BillHistory";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
        <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
        <Route path="/invoice-items" element={<PrivateRoute><InvoiceItems /></PrivateRoute>} />
        <Route path="/bill" element={<PrivateRoute><BillView /></PrivateRoute>} />
        <Route path="/bill-history" element={<PrivateRoute><BillHistory /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;