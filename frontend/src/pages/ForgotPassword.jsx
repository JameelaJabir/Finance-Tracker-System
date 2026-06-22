import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdLockReset } from "react-icons/md";
import API from "../api/axios.js";

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", answer: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/v1/auth/forgot-password", form);
      if (data.success) {
        toast.success("Password reset successfully!");
        navigate("/login");
      } else {
        toast.error(data.message || "Reset failed. Check your details.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <MdLockReset className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
          <p className="text-slate-500 mt-1">Enter your details to reset your password</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Security Answer</label>
              <input type="text" className="input-field" placeholder="Your security answer" required
                value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" placeholder="Min. 6 characters" required
                value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
