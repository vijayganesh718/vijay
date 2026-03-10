import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInvoiceHistory } from "../api";

const BillHistory = () => {
    const [invoices, setInvoices] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        getInvoiceHistory()
            .then((res) => setInvoices(res.data))
            .catch(() => setError("Failed to load bill history"));
    }, []);

    const handleViewBill = (invoiceId) => {
        navigate(`/bill?id=${invoiceId}`);
    };

    return (
        <div>
            <Navbar />
            <div className="page-container">
                <h1>Bill History</h1>

                {error && <p className="error-msg">{error}</p>}

                <div className="card">
                    {invoices.length === 0 && !error ? (
                        <p className="empty-msg">No bills found yet.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.invoice_id}>
                                        <td>#{inv.invoice_id}</td>
                                        <td>{inv.customer_name}</td>
                                        <td>{inv.date}</td>
                                        <td>{inv.items_count}</td>
                                        <td>₹{inv.total.toFixed(2)}</td>
                                        <td>
                                            <button
                                                onClick={() => handleViewBill(inv.invoice_id)}
                                                className="btn-view-bill"
                                            >
                                                View Bill
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

export default BillHistory;
