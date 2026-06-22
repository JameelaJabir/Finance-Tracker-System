import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdSearch, MdDelete, MdPeople } from "react-icons/md";
import API from "../api/axios.js";
import Spinner from "../components/Spinner.jsx";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const fetchUsers = async (p = page, q = search) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/v1/admin/users?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / LIMIT) || 1);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and ALL their data? This cannot be undone.`)) return;
    try {
      await API.delete(`/v1/admin/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch { toast.error("Failed to delete user"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <span className="text-sm text-slate-400">({total} users)</span>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary px-3"><MdSearch /></button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); fetchUsers(1, ""); }} className="text-sm text-slate-400 hover:text-slate-600 px-2">Clear</button>
          )}
        </form>
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <MdPeople className="text-4xl mx-auto mb-2 text-slate-300" />
          <p>No users found.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  {["Name", "Email", "Phone", "Role", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {(u.name || "U")[0].toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 1 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                        {u.role === 1 ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 1 && (
                        <button onClick={() => handleDelete(u._id, u.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete user">
                          <MdDelete />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
