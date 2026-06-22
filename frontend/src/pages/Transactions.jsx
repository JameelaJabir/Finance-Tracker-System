import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdDownload, MdFilterList } from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";

const CATEGORIES = ["Food", "Transportation", "Entertainment", "Utilities", "Healthcare", "Education", "Shopping", "Rent", "Salary", "Freelance", "Investment", "Other"];
const fmt = (n) => `$${Number(n).toFixed(2)}`;
const emptyForm = { type: "expense", amount: "", category: "Food", description: "", tags: "", isRecurring: false, recurrencePattern: "none", endDate: "" };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ category: "", type: "" });
  const [showFilter, setShowFilter] = useState(false);

  const fetchTransactions = async () => {
    try {
      const { data } = await API.get("/v1/transactions/get-transactions");
      setTransactions(data.transactions || []);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleSearch = async () => {
    if (!search.trim()) return fetchTransactions();
    try {
      const { data } = await API.get(`/v1/transactions/search?q=${encodeURIComponent(search)}`);
      setTransactions(data.transactions || []);
    } catch { toast.error("Search failed"); }
  };

  const openCreate = () => { setForm(emptyForm); setModal("create"); };
  const openEdit = (t) => {
    setForm({ type: t.type, amount: t.amount, category: t.category, description: t.description || "", tags: (t.tags || []).join(", "), isRecurring: t.isRecurring || false, recurrencePattern: t.recurrencePattern || "none", endDate: t.endDate ? t.endDate.slice(0, 10) : "", _id: t._id });
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [], endDate: form.endDate || undefined };
      if (modal === "create") {
        await API.post("/v1/transactions/add-transaction", payload);
        toast.success("Transaction added!");
      } else {
        await API.put(`/v1/transactions/update-transaction/${form._id}`, payload);
        toast.success("Transaction updated!");
      }
      setModal(null);
      fetchTransactions();
    } catch { toast.error("Failed to save transaction"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await API.delete(`/v1/transactions/delete-transaction/${id}`);
      toast.success("Deleted!");
      fetchTransactions();
    } catch { toast.error("Failed to delete"); }
  };

  const handleExport = async () => {
    try {
      const { data } = await API.get("/v1/transactions/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
    } catch { toast.error("Export failed"); }
  };

  const displayed = transactions.filter((t) => {
    if (filter.category && t.category !== filter.category) return false;
    if (filter.type && t.type !== filter.type) return false;
    return true;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1 text-sm"><MdDownload /> Export CSV</button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm"><MdAdd /> Add</button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 min-w-[200px] gap-2">
            <input className="input-field flex-1" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            <button onClick={handleSearch} className="btn-secondary px-3"><MdSearch /></button>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className={`btn-secondary flex items-center gap-1 text-sm ${showFilter ? "bg-indigo-50 border-indigo-300" : ""}`}><MdFilterList /> Filter</button>
        </div>
        {showFilter && (
          <div className="flex flex-wrap gap-3 mt-3">
            <select className="input-field w-auto" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input-field w-auto" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button onClick={() => setFilter({ category: "", type: "" })} className="text-sm text-slate-400 hover:text-slate-600">Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs text-slate-500">
                {["Date", "Type", "Category", "Amount", "Description", "Tags", "Recurring", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayed.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">No transactions found.</td></tr>
              ) : displayed.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.type}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{t.category}</td>
                  <td className={`px-4 py-3 font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>{t.type === "income" ? "+" : "-"}{fmt(t.amount)}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">{t.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(t.tags || []).map((tag) => <span key={tag} className="bg-indigo-50 text-indigo-600 text-xs px-1.5 py-0.5 rounded">{tag}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{t.isRecurring ? t.recurrencePattern : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><MdEdit /></button>
                      <button onClick={() => handleDelete(t._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === "create" ? "Add Transaction" : "Edit Transaction"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="label">Amount ($)</label>
                <input type="number" min="0.01" step="0.01" className="input-field" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <input type="text" className="input-field" placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input type="text" className="input-field" placeholder="#food, #essentials" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
              <label htmlFor="recurring" className="text-sm text-slate-700">Recurring Transaction</label>
            </div>
            {form.isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Pattern</label>
                  <select className="input-field" value={form.recurrencePattern} onChange={(e) => setForm({ ...form, recurrencePattern: e.target.value })}>
                    {["daily", "weekly", "monthly"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
            )}
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
