import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getDashboardChart } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SalesGraph = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await getDashboardChart();
        setChartData(res.data);
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      }
    };
    fetchChartData();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Sales Graph</h1>
        
        <div className="card" style={{ padding: "24px", height: "500px", marginTop: "24px" }}>
          <h3 style={{ marginBottom: "24px", color: "var(--text-muted)" }}>Sales - Last 7 Days</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  itemStyle={{ color: '#2ecc71', fontWeight: 'bold' }}
                  formatter={(value) => [`₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Sales']}
                />
                <Bar dataKey="sales" fill="var(--primary-red)" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-msg" style={{ marginTop: "150px" }}>Loading chart data...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesGraph;
