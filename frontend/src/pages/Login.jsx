import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAccountBalance } from "react-icons/md";
import API from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/v1/auth/login", form);
      if (data.success) {
        login(data.user, data.token);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <MdAccountBalance className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Tracker</h1>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input-field" placeholder="••••••••" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm text-slate-500">
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
            <span>Don't have an account? <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Register</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
