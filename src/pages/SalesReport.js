import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { getDailyReport, getMonthlyReport } from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SalesReport = () => {
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setError("");
    setReport(null);
    setLoading(true);
    try {
      let res;
      if (reportType === "daily") {
        if (!date) { setError("Please select a date"); setLoading(false); return; }
        res = await getDailyReport(date);
      } else {
        if (!month || !year) { setError("Please select month and year"); setLoading(false); return; }
        res = await getMonthlyReport(parseInt(month), parseInt(year));
      }
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDailyPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("DAILY SALES REPORT", pageWidth / 2, 20, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(20, 25, pageWidth - 20, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date         : ${report.date}`, 20, 35);
    doc.text(`Total Bills  : ${report.total_bills}`, 20, 43);
    doc.text(`Total Items  : ${report.total_items}`, 20, 51);
    doc.text(`Total Sales  : Rs. ${report.total_sales.toFixed(2)}`, 20, 59);

    doc.line(20, 64, pageWidth - 20, 64);

    if (report.items.length > 0) {
      autoTable(doc, {
        startY: 68,
        head: [["Time", "Invoice", "Customer", "Product", "Qty", "Price", "Total"]],
        body: report.items.map((item) => [
          item.time,
          `#${item.invoice_id}`,
          item.customer_name,
          item.product_name,
          item.quantity,
          `${item.price.toFixed(2)}`,
          `${item.total.toFixed(2)}`
        ]),
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 20, right: 20 },
      });
    }

    const finalY = report.items.length > 0 ? doc.lastAutoTable.finalY + 10 : 74;
    doc.setLineWidth(0.5);
    doc.line(20, finalY - 4, pageWidth - 20, finalY - 4);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total : Rs. ${report.total_sales.toFixed(2)}`, 20, finalY + 4);
    doc.line(20, finalY + 10, pageWidth - 20, finalY + 10);

    doc.save(`Daily_Report_${report.date}.pdf`);
  };

  const handleDownloadMonthlyPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MONTHLY SALES REPORT", pageWidth / 2, 20, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(20, 25, pageWidth - 20, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Month        : ${report.month} ${report.year}`, 20, 35);
    doc.text(`Total Bills  : ${report.total_bills}`, 20, 43);
    doc.text(`Total Sales  : Rs. ${report.total_sales.toFixed(2)}`, 20, 51);

    doc.line(20, 56, pageWidth - 20, 56);

    // Day-wise breakdown table
    if (report.day_wise.length > 0) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Day-wise Breakdown", 20, 64);

      autoTable(doc, {
        startY: 68,
        head: [["Date", "Bills", "Sales (Rs.)"]],
        body: report.day_wise.map((d) => [d.date, d.bills, d.sales.toFixed(2)]),
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 2: { halign: "right" } },
        margin: { left: 20, right: 20 },
      });
    }

    // Top products table
    if (report.top_products.length > 0) {
      const afterDayTable = report.day_wise.length > 0 ? doc.lastAutoTable.finalY + 15 : 64;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Top Selling Products", 20, afterDayTable);

      autoTable(doc, {
        startY: afterDayTable + 4,
        head: [["Product", "Qty Sold", "Revenue (Rs.)"]],
        body: report.top_products.map((p) => [p.name, p.quantity, p.revenue.toFixed(2)]),
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 2: { halign: "right" } },
        margin: { left: 20, right: 20 },
      });
    }

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 64;
    doc.setLineWidth(0.5);
    doc.line(20, finalY - 4, pageWidth - 20, finalY - 4);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total : Rs. ${report.total_sales.toFixed(2)}`, 20, finalY + 4);
    doc.line(20, finalY + 10, pageWidth - 20, finalY + 10);

    doc.save(`Monthly_Report_${report.month}_${report.year}.pdf`);
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Sales Reports</h1>

        <div className="card">
          <h3>Generate Report</h3>

          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={() => { setReportType("daily"); setReport(null); setError(""); }}
              className={reportType === "daily" ? "btn-primary" : "btn-secondary"}
              style={reportType !== "daily" ? { padding: "10px 24px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-dark)", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", fontWeight: "600" } : {}}
            >
              📅 Daily Report
            </button>
            <button
              onClick={() => { setReportType("monthly"); setReport(null); setError(""); }}
              className={reportType === "monthly" ? "btn-primary" : "btn-secondary"}
              style={reportType !== "monthly" ? { padding: "10px 24px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-dark)", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", fontWeight: "600" } : {}}
            >
              📊 Monthly Report
            </button>
          </div>

          <div className="form-row">
            {reportType === "daily" ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                style={{ colorScheme: "dark" }}
              />
            ) : (
              <>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="input"
                >
                  <option value="">-- Select Month --</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input"
                  min="2020"
                  max="2030"
                />
              </>
            )}
            <button onClick={handleGenerate} className="btn-primary" disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>

        {!report && (
          <div className="helper-steps">
            <h3>📖 How to Generate a Sales Report</h3>
            <div className="helper-step">
              <div className="step-number">1</div>
              <div className="step-text">Choose between <strong>"Daily Report"</strong> to see one day's sales, or <strong>"Monthly Report"</strong> for the full month breakdown.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">2</div>
              <div className="step-text">For Daily: <strong>pick a date</strong>. For Monthly: <strong>select a month and year</strong>.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">3</div>
              <div className="step-text">Click <strong>"Generate Report"</strong> to view the sales summary with totals, itemized breakdown, and top products.</div>
            </div>
            <div className="helper-step">
              <div className="step-number">4</div>
              <div className="step-text">Click <strong>"Download PDF"</strong> to save the report as a professional document for your records.</div>
            </div>
          </div>
        )}

        {/* DAILY REPORT DISPLAY */}
        {report && reportType === "daily" && (
          <div className="card">
            <h3>📅 Daily Report — {report.date}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div className="report-stat-card">
                <div className="report-stat-label">Total Bills</div>
                <div className="report-stat-value">{report.total_bills}</div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-label">Items Sold</div>
                <div className="report-stat-value">{report.total_items}</div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-label">Total Sales</div>
                <div className="report-stat-value" style={{ color: "#2ecc71" }}>₹{report.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {report.items.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price (₹)</th>
                    <th>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.time}</td>
                      <td>#{item.invoice_id}</td>
                      <td>{item.customer_name}</td>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-msg">No sales on this date.</p>
            )}

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button onClick={handleDownloadDailyPDF} className="btn-download">⬇ Download PDF</button>
            </div>
          </div>
        )}

        {/* MONTHLY REPORT DISPLAY */}
        {report && reportType === "monthly" && (
          <div className="card">
            <h3>📊 Monthly Report — {report.month} {report.year}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div className="report-stat-card">
                <div className="report-stat-label">Total Bills</div>
                <div className="report-stat-value">{report.total_bills}</div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-label">Total Sales</div>
                <div className="report-stat-value" style={{ color: "#2ecc71" }}>₹{report.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {report.day_wise.length > 0 && (
              <>
                <h4 style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "1.1rem" }}>Day-wise Breakdown</h4>
                <table className="data-table" style={{ marginBottom: "32px" }}>
                  <thead>
                    <tr><th>Date</th><th>Bills</th><th>Sales (₹)</th></tr>
                  </thead>
                  <tbody>
                    {report.day_wise.map((d, idx) => (
                      <tr key={idx}>
                        <td>{d.date}</td>
                        <td>{d.bills}</td>
                        <td>₹{d.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {report.top_products.length > 0 && (
              <>
                <h4 style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "1.1rem" }}>Top Selling Products</h4>
                <table className="data-table">
                  <thead>
                    <tr><th>Product</th><th>Qty Sold</th><th>Revenue (₹)</th></tr>
                  </thead>
                  <tbody>
                    {report.top_products.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.name}</td>
                        <td>{p.quantity}</td>
                        <td>₹{p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {report.day_wise.length === 0 && (
              <p className="empty-msg">No sales in this month.</p>
            )}

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button onClick={handleDownloadMonthlyPDF} className="btn-download">⬇ Download PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
