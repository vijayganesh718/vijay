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
        doc.setLineWidth(0.5);
        doc.line(20, 30, pageWidth - 20, 30);

        // Bill info
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Shop Name     : ${bill.shop_name}`, 20, 40);
        doc.text(`Date          : ${bill.date}`, 20, 48);
        doc.text(`Time          : ${bill.time}`, 20, 56);
        doc.text(`Customer Name : ${bill.customer_name}`, 20, 64);

        // Line before table
        doc.line(20, 70, pageWidth - 20, 70);

        // Items table
        autoTable(doc, {
            startY: 74,
            head: [["S.No", "Item Name", "Qty", "Price"]],
            body: bill.items.map((item) => [
                item.sno,
                item.name,
                item.quantity,
                `${item.price.toFixed(2)}`,
            ]),
            theme: "grid",
            headStyles: {
                fillColor: [40, 40, 40],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
            },
            columnStyles: {
                0: { halign: "center", cellWidth: 20 },
                1: { halign: "left" },
                2: { halign: "center", cellWidth: 25 },
                3: { halign: "right", cellWidth: 35 },
            },
            margin: { left: 20, right: 20 },
            styles: {
                fontSize: 11,
                cellPadding: 4,
            },
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.line(20, finalY - 4, pageWidth - 20, finalY - 4);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(
            `Total Amount : Rs. ${bill.total.toFixed(2)}`,
            20,
            finalY + 4
        );
        doc.line(20, finalY + 10, pageWidth - 20, finalY + 10);

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
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.items.map((item) => (
                                        <tr key={item.sno}>
                                            <td>{item.sno}</td>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="bill-header-line"></div>

                            <div className="bill-total">
                                <span>Total Amount</span>
                                <strong>₹{bill.total.toFixed(2)}</strong>
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
