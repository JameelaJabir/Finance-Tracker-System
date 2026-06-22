import { useState, useEffect } from "react";
import { MdPeople, MdSwapHoriz, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import API from "../api/axios.js";
import StatCard from "../components/StatCard.jsx";
import Spinner from "../components/Spinner.jsx";

const fmt = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, tx] = await Promise.all([
          API.get("/v1/dashboard/admin"),
          API.get("/v1/admin/transactions?limit=10"),
        ]);
        setStats(s.data.data);
        setTransactions(tx.data.transactions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Spinner />;

  const chartData = [
    { name: "Income", value: stats?.totalIncome || 0 },
    { name: "Expense", value: stats?.totalExpense || 0 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Admin Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<MdPeople />} color="indigo" />
        <StatCard title="Total Transactions" value={stats?.totalTransactions || 0} icon={<MdSwapHoriz />} color="blue" />
        <StatCard title="System Income" value={fmt(stats?.totalIncome)} icon={<MdTrendingUp />} color="green" />
        <StatCard title="System Expenses" value={fmt(stats?.totalExpense)} icon={<MdTrendingDown />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Income vs Expenses (System-wide)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">System Summary</h3>
          <div className="space-y-4">
            {[
              { label: "Net Balance", value: fmt((stats?.totalIncome || 0) - (stats?.totalExpense || 0)), color: "text-indigo-600" },
              { label: "Avg. per User", value: stats?.totalUsers ? fmt((stats?.totalIncome || 0) / stats.totalUsers) : "$0.00", color: "text-blue-600" },
              { label: "Transactions / User", value: stats?.totalUsers ? ((stats?.totalTransactions || 0) / stats.totalUsers).toFixed(1) : "0", color: "text-slate-600" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions system-wide */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Latest System Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="py-2 pr-4 text-slate-600">{t.userId?.name || "—"}</td>
                    <td className="py-2 pr-4 font-medium text-slate-800">{t.category}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.type}</span>
                    </td>
                    <td className={`py-2 pr-4 font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                    </td>
                    <td className="py-2 text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
