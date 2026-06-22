import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdNotifications, MdCheck, MdDelete, MdCheckCircle } from "react-icons/md";
import API from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";

const typeConfig = {
  budget_alert: { label: "Budget Alert", color: "bg-yellow-100 text-yellow-700" },
  budget_exceeded: { label: "Budget Exceeded", color: "bg-red-100 text-red-700" },
  goal_completed: { label: "Goal Reached", color: "bg-green-100 text-green-700" },
  recurring: { label: "Recurring", color: "bg-blue-100 text-blue-700" },
  info: { label: "Info", color: "bg-slate-100 text-slate-600" },
};

function getConfig(type) {
  return typeConfig[type] || { label: type || "Notice", color: "bg-indigo-100 text-indigo-600" };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications/get-notifications");
      setNotifications(data.notifications || []);
    } catch { toast.error("Failed to load notifications"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/mark-read/${id}`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch { toast.error("Failed to mark as read"); }
  };

  const markAllRead = async () => {
    try {
      await API.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch { toast.error("Failed to mark all as read"); }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/delete-notification/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch { toast.error("Failed to delete notification"); }
  };

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : filter === "read"
    ? notifications.filter((n) => n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-1 text-sm"><MdCheckCircle /> Mark all read</button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "unread", "read"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <MdNotifications className="text-4xl mx-auto mb-2 text-slate-300" />
          <p>{filter === "unread" ? "No unread notifications." : "No notifications found."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => {
            const cfg = getConfig(n.type);
            return (
              <div key={n._id} className={`card flex items-start gap-3 transition-all ${!n.read ? "border-l-4 border-indigo-400" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" title="Unread" />}
                    <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700">{n.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => markRead(n._id)} title="Mark as read" className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                      <MdCheck />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n._id)} title="Delete" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <MdDelete />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
