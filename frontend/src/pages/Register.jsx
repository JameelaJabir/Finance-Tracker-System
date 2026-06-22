import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAccountBalance } from "react-icons/md";
import API from "../api/axios.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "", answer: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data } = await API.post("/v1/auth/register", form);
      if (data.success) {
        toast.success("Registration successful! Please log in.");
        navigate("/login");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Registration failed. Please try again.");
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
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1">Start tracking your finances today</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
              { field: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { field: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
              { field: "phone", label: "Phone Number", type: "tel", placeholder: "+94 77 123 4567" },
              { field: "address", label: "Address", type: "text", placeholder: "123 Main St, City" },
              { field: "answer", label: "Security Answer", type: "text", placeholder: "Your mother's maiden name?" },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input type={type} className="input-field" placeholder={placeholder} required
                  value={form[field]} onChange={set(field)} />
              </div>
            ))}
            <p className="text-xs text-slate-400">Security answer is used for password recovery.</p>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
