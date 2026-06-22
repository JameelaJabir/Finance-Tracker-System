import { useState } from "react";
import { Link } from "react-router-dom";
import { MdMenu, MdNotifications, MdPerson } from "react-icons/md";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <MdMenu className="text-2xl text-slate-600" />
      </button>

      <div className="hidden lg:block">
        <h1 className="text-slate-500 text-sm">Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span></h1>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Link to="/notifications" className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
          <MdNotifications className="text-2xl text-slate-600" />
        </Link>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
          <MdPerson className="text-indigo-600 text-xl" />
        </Link>
      </div>
    </header>
  );
}
