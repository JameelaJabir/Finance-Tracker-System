import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdDelete, MdSave, MdSettings } from "react-icons/md";
import API from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [limits, setLimits] = useState({});
  const [savingLimits, setSavingLimits] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await API.get("/v1/admin/settings");
      setSettings(data.settings);
      const lims = {};
      if (data.settings?.categoryLimits) {
        Object.entries(data.settings.categoryLimits).forEach(([k, v]) => { lims[k] = v; });
      }
      setLimits(lims);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const cat = newCategory.trim();
    if (!cat) return;
    if (settings?.categories?.includes(cat)) return toast.error("Category already exists");
    try {
      await API.post("/v1/admin/settings/categories", { category: cat });
      toast.success(`Category "${cat}" added`);
      setNewCategory("");
      fetchSettings();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to add category"); }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat}"?`)) return;
    try {
      await API.delete(`/v1/admin/settings/categories/${encodeURIComponent(cat)}`);
      toast.success(`Category "${cat}" deleted`);
      fetchSettings();
    } catch { toast.error("Failed to delete category"); }
  };

  const handleSaveLimits = async () => {
    setSavingLimits(true);
    try {
      const filtered = {};
      Object.entries(limits).forEach(([k, v]) => { if (v !== "" && Number(v) > 0) filtered[k] = Number(v); });
      await API.put("/v1/admin/settings/category-limits", { categoryLimits: filtered });
      toast.success("Spending limits saved!");
      fetchSettings();
    } catch { toast.error("Failed to save limits"); }
    finally { setSavingLimits(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <MdSettings className="text-xl text-slate-600" />
        <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
      </div>

      {/* Manage Categories */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Expense Categories</h3>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="New category name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button type="submit" className="btn-primary flex items-center gap-1 text-sm"><MdAdd /> Add</button>
        </form>

        <div className="divide-y divide-slate-50">
          {(settings?.categories || []).map((cat) => (
            <div key={cat} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-slate-700">{cat}</span>
              <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Remove category">
                <MdDelete className="text-base" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Category Spending Limits */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Monthly Spending Limits</h3>
          <button onClick={handleSaveLimits} disabled={savingLimits} className="btn-primary flex items-center gap-1 text-sm">
            <MdSave /> {savingLimits ? "Saving..." : "Save Limits"}
          </button>
        </div>
        <p className="text-xs text-slate-400">Set maximum monthly spending per category (leave blank for no limit).</p>
        <div className="space-y-3">
          {(settings?.categories || []).map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 w-36 shrink-0">{cat}</label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field pl-7"
                  placeholder="No limit"
                  value={limits[cat] ?? ""}
                  onChange={(e) => setLimits({ ...limits, [cat]: e.target.value })}
                />
              </div>
              {limits[cat] && Number(limits[cat]) > 0 && (
                <button onClick={() => setLimits({ ...limits, [cat]: "" })} className="text-xs text-slate-400 hover:text-red-500 whitespace-nowrap">Clear</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {settings?.updatedAt && (
        <p className="text-xs text-slate-400 text-right">Last updated: {new Date(settings.updatedAt).toLocaleString()}</p>
      )}
    </div>
  );
}
