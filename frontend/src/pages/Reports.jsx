import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdDownload } from "react-icons/md";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import API from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

function buildDateRange(months = 6) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

export default function Reports() {
  const [incomeVsExpense, setIncomeVsExpense] = useState(null);
  const [spendingTrends, setSpendingTrends] = useState([]);
  const [filteredTx, setFilteredTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = buildDateRange(Number(range));
      const qs = `startDate=${startDate}&endDate=${endDate}`;
      const [ive, st, fr] = await Promise.all([
        API.get(`/v1/reports/income-vs-expenses?${qs}`),
        API.get(`/v1/reports/spending-trends?${qs}`),
        API.get(`/v1/reports/filtered-report?${qs}${categoryFilter ? `&category=${categoryFilter}` : ""}`),
      ]);
      setIncomeVsExpense(ive.data.report);
      // spending-trends returns { "June 2025": 150, "May 2025": 200, ... }
      const trendsMap = st.data.report || {};
      const trendsArr = Object.entries(trendsMap).map(([label, amount]) => ({ label, amount })).reverse();
      setSpendingTrends(trendsArr);
      setFilteredTx(fr.data.transactions || []);
    } catch { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [range, categoryFilter]);

  const handleExport = async () => {
    try {
      const { data } = await API.get("/v1/transactions/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
    } catch { toast.error("Export failed"); }
  };

  // Build category breakdown from filtered transactions
  const categoryMap = {};
  filteredTx.filter((t) => t.type === "expense").forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount, count: filteredTx.filter((t) => t.category === category).length }))
    .sort((a, b) => b.amount - a.amount);

  const barData = incomeVsExpense
    ? [{ name: "Income", value: incomeVsExpense.income }, { name: "Expense", value: incomeVsExpense.expense }]
    : [];

  const CATEGORIES = ["Food", "Transportation", "Entertainment", "Utilities", "Healthcare", "Education", "Shopping", "Rent", "Other"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Reports & Analytics</h2>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-1 text-sm"><MdDownload /> Export CSV</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Time Range</label>
          <select className="input-field w-auto" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="1">Last 1 month</option>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input-field w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Summary cards */}
          {incomeVsExpense && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Income", value: fmt(incomeVsExpense.income), color: "text-green-600", bg: "bg-green-50" },
                { label: "Total Expenses", value: fmt(incomeVsExpense.expense), color: "text-red-500", bg: "bg-red-50" },
                {
                  label: "Net Balance",
                  value: fmt((incomeVsExpense.income || 0) - (incomeVsExpense.expense || 0)),
                  color: (incomeVsExpense.income || 0) >= (incomeVsExpense.expense || 0) ? "text-indigo-600" : "text-red-600",
                  bg: (incomeVsExpense.income || 0) >= (incomeVsExpense.expense || 0) ? "bg-indigo-50" : "bg-red-50",
                },
              ].map((s) => (
                <div key={s.label} className={`card ${s.bg}`}>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Spending Trends Line Chart */}
          {spendingTrends.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-4">Expense Spending Trends</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expense Bar Chart */}
            {barData.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Income vs Expense</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Breakdown Pie Chart */}
            {categoryBreakdown.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Expense by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={85}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category breakdown table */}
          {categoryBreakdown.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-4">Category Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Transactions</th>
                      <th className="pb-2">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categoryBreakdown.map((row, i) => {
                      const total = categoryBreakdown.reduce((s, r) => s + r.amount, 0);
                      const pct = total > 0 ? ((row.amount / total) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={row.category}>
                          <td className="py-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                            {row.category}
                          </td>
                          <td className="py-2 font-semibold text-slate-800">{fmt(row.amount)}</td>
                          <td className="py-2 text-slate-500">{row.count}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 bg-slate-100 rounded-full w-24 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                              <span className="text-xs text-slate-500">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {spendingTrends.length === 0 && categoryBreakdown.length === 0 && !incomeVsExpense && (
            <div className="card text-center py-12 text-slate-400">No report data available for the selected period.</div>
          )}
        </>
      )}
    </div>
  );
}
