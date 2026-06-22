import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdTrendingUp, MdTrendingDown, MdAccountBalance, MdFlag, MdArrowForward } from "react-icons/md";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import API from "../api/axios.js";
import StatCard from "../components/StatCard.jsx";
import Spinner from "../components/Spinner.jsx";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

function HealthScore({ score, grade }) {
  const color = score >= 80 ? "text-green-500" : score >= 60 ? "text-blue-500" : score >= 40 ? "text-yellow-500" : "text-red-500";
  const ring = score >= 80 ? "stroke-green-500" : score >= 60 ? "stroke-blue-500" : score >= 40 ? "stroke-yellow-500" : "stroke-red-500";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="card flex flex-col items-center gap-2">
      <h3 className="text-sm font-semibold text-slate-500">Financial Health Score</h3>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="10"
          className={ring}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)" />
        <text x="70" y="66" textAnchor="middle" className="fill-slate-800 text-2xl font-bold" style={{ fontSize: 26, fontWeight: 700 }}>{score}</text>
        <text x="70" y="86" textAnchor="middle" style={{ fontSize: 13 }} className="fill-slate-400">{grade}</text>
      </svg>
      <p className="text-xs text-slate-400">Based on budgets, savings & income ratio</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dash, h, tx] = await Promise.all([
          API.get("/v1/dashboard/user"),
          API.get("/v1/dashboard/health-score"),
          API.get("/v1/transactions/get-transactions"),
        ]);
        setData(dash.data.data);
        setHealth(h.data);
        setTransactions(tx.data.transactions?.slice(0, 5) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Spinner />;

  const budgetData = (data?.budgets || []).map((b) => ({
    name: b.category,
    spent: b.currentSpending,
    limit: b.amount,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={fmt(data?.incomeTotal)} icon={<MdTrendingUp />} color="green" />
        <StatCard title="Total Expenses" value={fmt(data?.expenseTotal)} icon={<MdTrendingDown />} color="red" />
        <StatCard title="Net Balance" value={fmt((data?.incomeTotal || 0) - (data?.expenseTotal || 0))}
          icon={<MdAccountBalance />} color={(data?.incomeTotal || 0) >= (data?.expenseTotal || 0) ? "indigo" : "red"} />
        <StatCard title="Active Goals" value={data?.goals?.length || 0} icon={<MdFlag />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        {health && <HealthScore score={health.score} grade={health.grade} />}

        {/* Budget Overview */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Budget Overview</h3>
            <Link to="/budgets" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <MdArrowForward /></Link>
          </div>
          {budgetData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No budgets yet. <Link to="/budgets" className="text-indigo-600">Create one</Link></p>
          ) : (
            <div className="space-y-3">
              {budgetData.slice(0, 4).map((b) => {
                const pct = Math.min((b.spent / b.limit) * 100, 100);
                const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-green-500";
                return (
                  <div key={b.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{b.name}</span>
                      <span className="text-slate-500">{fmt(b.spent)} / {fmt(b.limit)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Goals progress */}
      {data?.goals?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Savings Goals</h3>
            <Link to="/goals" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <MdArrowForward /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.goals.slice(0, 3).map((g) => {
              const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
              return (
                <div key={g._id} className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 text-sm truncate">{g.name}</p>
                  <div className="flex justify-between text-xs text-slate-500 mt-1 mb-2">
                    <span>{fmt(g.savedAmount)} saved</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Target: {fmt(g.targetAmount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
          <Link to="/transactions" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <MdArrowForward /></Link>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.category}</p>
                  <p className="text-xs text-slate-400">{t.description || "—"} · {new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
