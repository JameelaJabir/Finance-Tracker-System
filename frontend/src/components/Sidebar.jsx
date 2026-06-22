import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  MdDashboard, MdSwapHoriz, MdAccountBalance, MdFlag,
  MdBarChart, MdNotifications, MdCurrencyExchange, MdPeople,
  MdSettings, MdLogout, MdPerson,
} from "react-icons/md";

const navItem = "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors";
const active = "bg-indigo-600 text-white";
const inactive = "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700";

export default function Sidebar({ onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MdAccountBalance className="text-white text-lg" />
          </div>
          <span className="font-bold text-slate-800 text-lg">FinTracker</span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <MdPerson className="text-indigo-600 text-xl" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">{isAdmin ? "Administrator" : "User"}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</p>

        <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdDashboard className="text-xl" /> Dashboard
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdSwapHoriz className="text-xl" /> Transactions
        </NavLink>
        <NavLink to="/budgets" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdAccountBalance className="text-xl" /> Budgets
        </NavLink>
        <NavLink to="/goals" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdFlag className="text-xl" /> Goals
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdBarChart className="text-xl" /> Reports
        </NavLink>
        <NavLink to="/currency" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdCurrencyExchange className="text-xl" /> Currency
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdNotifications className="text-xl" /> Notifications
        </NavLink>

        {isAdmin && (
          <>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2">Admin</p>
            <NavLink to="/admin" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
              <MdDashboard className="text-xl" /> Admin Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
              <MdPeople className="text-xl" /> Manage Users
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
              <MdSettings className="text-xl" /> System Settings
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <NavLink to="/profile" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`} onClick={onClose}>
          <MdPerson className="text-xl" /> Profile
        </NavLink>
        <button onClick={handleLogout} className={`w-full text-left ${navItem} text-red-500 hover:bg-red-50 hover:text-red-600`}>
          <MdLogout className="text-xl" /> Logout
        </button>
      </div>
    </div>
  );
}
