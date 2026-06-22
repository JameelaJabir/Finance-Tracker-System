import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdEdit, MdDelete, MdTrendingUp } from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";

const CATEGORIES = ["Food", "Transportation", "Entertainment", "Utilities", "Healthcare", "Education", "Shopping", "Rent", "Other"];
const emptyForm = { category: "Food", amount: "", period: "monthly", notificationThreshold: 80, notes: "" };
const statusColor = { safe: "bg-green-100 text-green-700", warning: "bg-yellow-100 text-yellow-700", exceeded: "bg-red-100 text-red-700" };
const barColor = { safe: "bg-green-500", warning: "bg-yellow-400", exceeded: "bg-red-500" };

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("list");

  const fetchBudgets = async () => {
    try {
      const [b, a] = await Promise.all([API.get("/v1/budgets/get-budget"), API.get("/v1/budgets/analysis-budget/status")]);
      setBudgets(b.data.budgets || []);
      setAnalysis(a.data.budgetAnalysis || []);
    } catch { toast.error("Failed to load budgets"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal("create"); };
  const openEdit = (b) => { setForm({ category: b.category, amount: b.amount, period: b.period, notificationThreshold: b.notificationThreshold, notes: b.notes || "", _id: b._id }); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), notificationThreshold: Number(form.notificationThreshold) };
      if (modal === "create") {
        await API.post("/v1/budgets/create-budget", payload);
        toast.success("Budget created!");
      } else {
        await API.put(`/v1/budgets/update-budget/${form._id}`, payload);
        toast.success("Budget updated!");
      }
      setModal(null);
      fetchBudgets();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save budget"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await API.delete(`/v1/budgets/delete-budget/${id}`);
      toast.success("Deleted!"); fetchBudgets();
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Budgets</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm"><MdAdd /> Create Budget</button>
      </div>

      <div className="flex gap-2">
        {["list", "analysis"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{t}</button>
        ))}
      </div>

      {tab === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.length === 0 ? (
            <div className="col-span-3 card text-center py-8 text-slate-400">No budgets yet. Create your first budget!</div>
          ) : budgets.map((b) => {
            const pct = Math.min(((b.currentSpending || 0) / b.amount) * 100, 100);
            return (
              <div key={b._id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{b.category}</h3>
                    <p className="text-xs text-slate-400 capitalize">{b.period}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[b.status] || "bg-slate-100 text-slate-600"}`}>{b.status}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">${(b.currentSpending || 0).toFixed(2)} spent</span>
                    <span className="font-semibold text-slate-800">${b.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor[b.status] || "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct.toFixed(1)}% used · Alert at {b.notificationThreshold}%</p>
                </div>
                {b.notes && <p className="text-xs text-slate-400 italic">{b.notes}</p>}
                <div className="flex gap-2 pt-1 border-t border-slate-50">
                  <button onClick={() => openEdit(b)} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1"><MdEdit /> Edit</button>
                  <button onClick={() => handleDelete(b._id)} className="btn-danger text-xs flex-1 flex items-center justify-center gap-1"><MdDelete /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "analysis" && (
        <div className="space-y-4">
          {analysis.length === 0 ? (
            <div className="card text-center py-8 text-slate-400">No analysis available. Create some budgets first.</div>
          ) : analysis.map((item) => (
            <div key={item.budget._id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{item.budget.category}</h3>
                  <p className="text-sm text-slate-500">${(item.budget.currentSpending || 0).toFixed(2)} / ${item.budget.amount.toFixed(2)} · <span className="font-medium">{item.percentageUsed}% used</span></p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[item.status]}`}>{item.status}</span>
              </div>
              {item.spendingTrend.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><MdTrendingUp /> Spending Trend</p>
                  <div className="flex gap-2">
                    {item.spendingTrend.map((s) => (
                      <div key={s.month} className="flex-1 bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400">{s.month.slice(0, 3)}</p>
                        <p className="text-sm font-semibold text-slate-700">${s.amount.toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {item.recommendations.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">Recommendations</p>
                  <ul className="space-y-1">
                    {item.recommendations.map((r, i) => <li key={i} className="text-xs text-indigo-600">• {r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Create Budget" : "Edit Budget"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Budget Amount ($)</label>
                <input type="number" min="1" className="input-field" placeholder="500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Period</label>
                <select className="input-field" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  {["monthly", "quarterly", "yearly"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Alert Threshold (%)</label>
              <input type="number" min="1" max="100" className="input-field" value={form.notificationThreshold} onChange={(e) => setForm({ ...form, notificationThreshold: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input type="text" className="input-field" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.amount} className="btn-primary flex-1">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
