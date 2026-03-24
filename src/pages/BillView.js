import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getBillDetails } from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BillView = () => {
    const [searchParams] = useSearchParams();
    const [invoiceId, setInvoiceId] = useState("");
    const [bill, setBill] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const idFromUrl = searchParams.get("id");
        if (idFromUrl) {
            setInvoiceId(idFromUrl);
            loadBill(idFromUrl);
        }
    }, [searchParams]);

    const loadBill = async (id) => {
        setError("");
        setBill(null);
        try {
            const res = await getBillDetails(parseInt(id));
            setBill(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load bill");
        }
    };

    const handleViewBill = async () => {
        setError("");
        setBill(null);
        if (!invoiceId) {
            setError("Please enter Invoice ID");
            return;
        }
        try {
            const res = await getBillDetails(parseInt(invoiceId));
            setBill(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load bill");
        }
    };

    const handleDownloadPDF = () => {
        if (!bill) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("BILL", pageWidth / 2, 25, { align: "center" });

        // Top line
        doc.setLineWidth(1);
        doc.line(20, 30, pageWidth - 20, 30);

        // Bill info — fixed X positions for alignment
        const labelX = 20;
        const colonX = 75;
        const valueX = 80;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Shop Name", labelX, 40);
        doc.text(":", colonX, 40);
        doc.text(`${bill.shop_name}`, valueX, 40);
        doc.text("Date", labelX, 48);
        doc.text(":", colonX, 48);
        doc.text(`${bill.date}`, valueX, 48);
        doc.text("Time", labelX, 56);
        doc.text(":", colonX, 56);
        doc.text(`${bill.time}`, valueX, 56);
        doc.text("Customer Name", labelX, 64);
        doc.text(":", colonX, 64);
        doc.text(`${bill.customer_name}`, valueX, 64);

        // Line before table
        doc.line(20, 70, pageWidth - 20, 70);

        // Items table with GST
        autoTable(doc, {
            startY: 74,
            head: [["S.No", "Item Name", "Qty", "Price", "GST %", "GST Amt", "Total"]],
            body: bill.items.map((item) => [
                item.sno,
                item.name,
                item.quantity,
                `${item.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                `${item.gst_rate}%`,
                `${item.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                `${item.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            ]),
            theme: "grid",
            headStyles: {
                fillColor: [40, 40, 40],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
            },
            columnStyles: {
                0: { halign: "center", cellWidth: 15 },
                1: { halign: "left" },
                2: { halign: "center", cellWidth: 15 },
                3: { halign: "right", cellWidth: 25 },
                4: { halign: "center", cellWidth: 20 },
                5: { halign: "right", cellWidth: 25 },
                6: { halign: "right", cellWidth: 25 },
            },
            margin: { left: 20, right: 20 },
            styles: {
                fontSize: 10,
                cellPadding: 4,
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
            },
        });

        // GST Breakdown — fixed X positions
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setLineWidth(1);
        doc.line(20, finalY - 4, pageWidth - 20, finalY - 4);
        const sumLabelX = 20;
        const sumColonX = 85;
        const sumValueX = 90;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Subtotal (before GST)", sumLabelX, finalY + 4);
        doc.text(":", sumColonX, finalY + 4);
        doc.text(`Rs. ${bill.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sumValueX, finalY + 4);
        doc.text("Total GST", sumLabelX, finalY + 12);
        doc.text(":", sumColonX, finalY + 12);
        doc.text(`Rs. ${bill.total_gst.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sumValueX, finalY + 12);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("Grand Total", sumLabelX, finalY + 22);
        doc.text(":", sumColonX, finalY + 22);
        doc.text(`Rs. ${bill.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sumValueX, finalY + 22);
        doc.line(20, finalY + 28, pageWidth - 20, finalY + 28);

        doc.save(`Bill_Invoice_${bill.invoice_id}.pdf`);
    };

    return (
        <div>
            <Navbar />
            <div className="page-container">
                <h1>View Bill</h1>

                <div className="card">
                    <h3>Enter Invoice ID</h3>
                    <div className="form-row">
                        <input
                            placeholder="Invoice ID"
                            type="number"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            className="input"
                        />
                        <button onClick={handleViewBill} className="btn-primary">
                            View Bill
                        </button>
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                </div>

                {!bill && (
                  <div className="helper-steps">
                    <h3>📖 How to View a Bill</h3>
                    <div className="helper-step">
                      <div className="step-number">1</div>
                      <div className="step-text">Enter the <strong>Invoice ID</strong> in the field above. You can find this from the <strong>Invoices</strong> or <strong>Bill History</strong> page.</div>
                    </div>
                    <div className="helper-step">
                      <div className="step-number">2</div>
                      <div className="step-text">Click the <strong>"View Bill"</strong> button to load the complete bill with all items.</div>
                    </div>
                    <div className="helper-step">
                      <div className="step-number">3</div>
                      <div className="step-text">Review the bill details — shop name, customer, items, and total amount.</div>
                    </div>
                    <div className="helper-step">
                      <div className="step-number">4</div>
                      <div className="step-text">Click <strong>"Download PDF"</strong> to save the bill as a professional PDF document.</div>
                    </div>
                  </div>
                )}

                {bill && (
                    <div className="bill-container">
                        <div className="bill-receipt">
                            <div className="bill-header-line"></div>
                            <h2 className="bill-title">BILL</h2>
                            <div className="bill-header-line"></div>

                            <div className="bill-info">
                                <div className="bill-info-row">
                                    <span className="bill-label">Shop Name</span>
                                    <span className="bill-colon">:</span>
                                    <span className="bill-value">{bill.shop_name}</span>
                                </div>
                                <div className="bill-info-row">
                                    <span className="bill-label">Date</span>
                                    <span className="bill-colon">:</span>
                                    <span className="bill-value">{bill.date}</span>
                                </div>
                                <div className="bill-info-row">
                                    <span className="bill-label">Time</span>
                                    <span className="bill-colon">:</span>
                                    <span className="bill-value">{bill.time}</span>
                                </div>
                                <div className="bill-info-row">
                                    <span className="bill-label">Customer Name</span>
                                    <span className="bill-colon">:</span>
                                    <span className="bill-value">{bill.customer_name}</span>
                                </div>
                            </div>

                            <div className="bill-header-line"></div>

                            <table className="bill-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Item Name</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>GST %</th>
                                        <th>GST Amt</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.items.map((item) => (
                                        <tr key={item.sno}>
                                            <td>{item.sno}</td>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td>{item.gst_rate}%</td>
                                            <td>₹{item.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td>₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="bill-header-line"></div>

                            <div className="bill-total" style={{ flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                                    <span>Subtotal</span>
                                    <span>₹{bill.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#e67e22" }}>
                                    <span>GST</span>
                                    <span>₹{bill.total_gst.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="bill-header-line" style={{ margin: "4px 0" }}></div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem" }}>
                                    <span><strong>Grand Total</strong></span>
                                    <strong>₹{bill.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                                </div>
                            </div>

                            <div className="bill-header-line"></div>
                        </div>

                        <button onClick={handleDownloadPDF} className="btn-download">
                            ⬇ Download PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillView;
