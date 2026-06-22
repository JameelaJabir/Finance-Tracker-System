import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { MdSwapHoriz, MdHistory } from "react-icons/md";
import API from "../api/axios.js";
import { AuthContext } from "../context/AuthContext.jsx";
import Spinner from "../components/Spinner.jsx";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "LKR", "SGD", "HKD", "NZD", "SEK", "NOK", "DKK", "MXN", "BRL", "ZAR", "AED"];

export default function Currency() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ originalAmount: "", originalCurrency: "USD", convertedCurrency: "EUR" });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user?._id) return setHistLoading(false);
    try {
      const { data } = await API.get(`/v1/currency/get-currency-transactions/${user._id}`);
      setHistory(data.data || []);
    } catch { /* history optional */ }
    finally { setHistLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!form.originalAmount || Number(form.originalAmount) <= 0) return toast.error("Enter a valid amount");
    if (form.originalCurrency === form.convertedCurrency) return toast.error("Select different currencies");
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post("/v1/currency/create-currency-transactions", {
        originalAmount: Number(form.originalAmount),
        originalCurrency: form.originalCurrency,
        convertedCurrency: form.convertedCurrency,
      });
      setResult(data.data);
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Conversion failed. Check your API key.");
    } finally { setLoading(false); }
  };

  const swapCurrencies = () => {
    setForm((f) => ({ ...f, originalCurrency: f.convertedCurrency, convertedCurrency: f.originalCurrency }));
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Currency Converter</h2>

      {/* Converter card */}
      <div className="card max-w-lg">
        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <input
              type="number" min="0.01" step="any" className="input-field" placeholder="100.00"
              value={form.originalAmount}
              onChange={(e) => setForm({ ...form, originalAmount: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="label">From</label>
              <select className="input-field" value={form.originalCurrency} onChange={(e) => setForm({ ...form, originalCurrency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button type="button" onClick={swapCurrencies} className="mb-0.5 p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors">
              <MdSwapHoriz className="text-xl" />
            </button>
            <div className="flex-1">
              <label className="label">To</label>
              <select className="input-field" value={form.convertedCurrency} onChange={(e) => setForm({ ...form, convertedCurrency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Converting..." : "Convert"}
          </button>
        </form>

        {result && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl text-center">
            <p className="text-sm text-slate-500 mb-1">
              {result.originalAmount} {result.originalCurrency} =
            </p>
            <p className="text-3xl font-bold text-indigo-600">
              {Number(result.convertedAmount).toFixed(4)} {result.convertedCurrency}
            </p>
            {result.exchangeRate && (
              <p className="text-xs text-slate-400 mt-2">Rate: 1 {result.originalCurrency} = {Number(result.exchangeRate).toFixed(4)} {result.convertedCurrency}</p>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><MdHistory /> Conversion History</h3>
        {histLoading ? (
          <Spinner />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No conversion history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  {["From", "To", "Original", "Converted", "Rate", "Date"].map((h) => (
                    <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((item, i) => (
                  <tr key={item._id || i}>
                    <td className="py-2 pr-4 font-medium text-slate-700">{item.originalCurrency}</td>
                    <td className="py-2 pr-4 font-medium text-slate-700">{item.convertedCurrency}</td>
                    <td className="py-2 pr-4 text-slate-600">{Number(item.originalAmount).toFixed(2)}</td>
                    <td className="py-2 pr-4 font-semibold text-indigo-600">{Number(item.convertedAmount).toFixed(4)}</td>
                    <td className="py-2 pr-4 text-slate-400 text-xs">{item.exchangeRate ? Number(item.exchangeRate).toFixed(4) : "—"}</td>
                    <td className="py-2 text-slate-400 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
