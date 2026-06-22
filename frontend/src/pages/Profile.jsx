import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { MdPerson, MdLock, MdSave } from "react-icons/md";
import API from "../api/axios.js";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, login } = useContext(AuthContext);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [tab, setTab] = useState("profile");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error("Name is required");
    setSavingProfile(true);
    try {
      const { data } = await API.put("/v1/auth/update-profile", profileForm);
      if (data.success) {
        toast.success("Profile updated!");
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const updated = { ...stored, ...profileForm };
        localStorage.setItem("user", JSON.stringify(updated));
        login(updated, localStorage.getItem("token"));
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords do not match");
    setSavingPw(true);
    try {
      const { data } = await API.put("/v1/auth/update-profile", { password: pwForm.newPassword });
      if (data.success) {
        toast.success("Password changed!");
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally { setSavingPw(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-800">My Profile</h2>

      {/* Avatar area */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(user?.name || "U")[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${user?.role === 1 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
            {user?.role === 1 ? "Administrator" : "User"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: "profile", icon: <MdPerson />, label: "Profile" }, { id: "password", icon: <MdLock />, label: "Password" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input-field" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input-field" placeholder="+1 234 567 8900" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Address</label>
                <input type="text" className="input-field" placeholder="Your address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
              <MdSave /> {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {tab === "password" && (
        <div className="card">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input-field" placeholder="••••••••" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" placeholder="Min. 6 characters" required value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input-field" placeholder="Repeat new password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
            </div>
            <button type="submit" disabled={savingPw} className="btn-primary flex items-center gap-2">
              <MdLock /> {savingPw ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
