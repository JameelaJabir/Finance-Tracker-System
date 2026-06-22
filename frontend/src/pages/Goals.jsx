import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdEdit, MdDelete, MdFlag, MdSavings } from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const emptyForm = { name: "", targetAmount: "", deadline: "", autoSavePercentage: 0, notes: "" };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [depositModal, setDepositModal] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  const fetchGoals = async () => {
    try {
      const { data } = await API.get("/v1/goals/list-goals");
      setGoals(data.goals || []);
    } catch { toast.error("Failed to load goals"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal("create"); };
  const openEdit = (g) => {
    setForm({ name: g.name, targetAmount: g.targetAmount, deadline: g.deadline ? g.deadline.slice(0, 10) : "", autoSavePercentage: g.autoSavePercentage || 0, notes: g.notes || "", _id: g._id });
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, targetAmount: Number(form.targetAmount), autoSavePercentage: Number(form.autoSavePercentage) };
      if (modal === "create") {
        await API.post("/v1/goals/create-goal", payload);
        toast.success("Goal created!");
      } else {
        await API.put(`/v1/goals/update-goal/${form._id}`, payload);
        toast.success("Goal updated!");
      }
      setModal(null);
      fetchGoals();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save goal"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await API.delete(`/v1/goals/delete-goal/${id}`);
      toast.success("Goal deleted!");
      fetchGoals();
    } catch { toast.error("Failed to delete goal"); }
  };

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return toast.error("Enter a valid amount");
    try {
      await API.put(`/v1/goals/update-goal/${depositModal._id}`, {
        savedAmount: (depositModal.savedAmount || 0) + Number(depositAmount),
      });
      toast.success("Deposit added!");
      setDepositModal(null);
      setDepositAmount("");
      fetchGoals();
    } catch { toast.error("Failed to update savings"); }
  };

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <Spinner />;

  const totalSaved = goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Savings Goals</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm"><MdAdd /> New Goal</button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Goals", value: goals.length, icon: <MdFlag />, color: "text-indigo-600" },
            { label: "Total Saved", value: fmt(totalSaved), icon: <MdSavings />, color: "text-green-600" },
            { label: "Total Target", value: fmt(totalTarget), icon: <MdFlag />, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="card flex items-center gap-3">
              <span className={`text-2xl ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <MdFlag className="text-4xl mx-auto mb-2 text-slate-300" />
          <p>No savings goals yet. Create your first goal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = g.progressPercentage ?? Math.min(Math.round(((g.savedAmount || 0) / g.targetAmount) * 100), 100);
            const days = daysLeft(g.deadline);
            const isComplete = pct >= 100;
            const isOverdue = days !== null && days < 0 && !isComplete;
            return (
              <div key={g._id} className={`card space-y-3 ${isComplete ? "border-2 border-green-300" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 truncate max-w-[160px]">{g.name}</h3>
                    {g.deadline && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                        {isComplete ? "Completed!" : isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </p>
                    )}
                  </div>
                  {isComplete && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Done!</span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">{fmt(g.savedAmount || 0)} saved</span>
                    <span className="font-semibold text-slate-800">{fmt(g.targetAmount)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-indigo-500" : "bg-indigo-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct}% of goal reached</p>
                </div>

                {g.autoSavePercentage > 0 && (
                  <p className="text-xs text-indigo-500">Auto-save: {g.autoSavePercentage}% of income</p>
                )}
                {g.notes && <p className="text-xs text-slate-400 italic">{g.notes}</p>}

                <div className="flex gap-2 pt-1 border-t border-slate-50">
                  <button onClick={() => { setDepositModal(g); setDepositAmount(""); }} className="btn-primary text-xs flex-1">+ Add Savings</button>
                  <button onClick={() => openEdit(g)} className="btn-secondary text-xs px-2"><MdEdit /></button>
                  <button onClick={() => handleDelete(g._id)} className="btn-danger text-xs px-2"><MdDelete /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Create Savings Goal" : "Edit Goal"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Goal Name</label>
              <input type="text" className="input-field" placeholder="e.g. Emergency Fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Target Amount ($)</label>
                <input type="number" min="1" className="input-field" placeholder="5000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input-field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Auto-Save % of Income</label>
              <input type="number" min="0" max="100" className="input-field" placeholder="0" value={form.autoSavePercentage} onChange={(e) => setForm({ ...form, autoSavePercentage: e.target.value })} />
              <p className="text-xs text-slate-400 mt-1">Automatically allocate this % of each income transaction to this goal.</p>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input type="text" className="input-field" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.targetAmount} className="btn-primary flex-1">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {depositModal && (
        <Modal title={`Add Savings — ${depositModal.name}`} onClose={() => setDepositModal(null)}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              Current: {fmt(depositModal.savedAmount || 0)} / {fmt(depositModal.targetAmount)} ({depositModal.progressPercentage ?? 0}%)
            </div>
            <div>
              <label className="label">Amount to Add ($)</label>
              <input type="number" min="0.01" step="0.01" className="input-field" placeholder="100.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDepositModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeposit} disabled={!depositAmount} className="btn-primary flex-1">Add Savings</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
