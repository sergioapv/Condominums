import { useState, useEffect } from "react";
import { getPayments, getResidents, createPayment, deletePayment, markPaymentPaid } from "../api";

const EMPTY_FORM = {
  resident: "", payment_type: "monthly_fee", amount: "",
  due_date: "", status: "pending", notes: "",
};

function PaymentModal({ residents, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Record Payment</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Resident</label>
              <select required value={form.resident} onChange={(e) => set("resident", e.target.value)}>
                <option value="">— Select resident —</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>{r.first_name} {r.last_name} {r.unit_number ? `(Unit ${r.unit_number})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.payment_type} onChange={(e) => set("payment_type", e.target.value)}>
                <option value="monthly_fee">Monthly Fee</option>
                <option value="special_assessment">Special Assessment</option>
                <option value="late_fee">Late Fee</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount ($)</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input required type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea rows="2" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusBadge = { paid: "badge-green", pending: "badge-yellow", overdue: "badge-red" };
const typeBadge = { monthly_fee: "badge-blue", special_assessment: "badge-gray", late_fee: "badge-red" };
const typeLabel = { monthly_fee: "Monthly Fee", special_assessment: "Special Assmt.", late_fee: "Late Fee" };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = () => {
    getPayments().then((r) => setPayments(r.data));
    getResidents().then((r) => setResidents(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    await createPayment(form);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this payment?")) return;
    await deletePayment(id);
    load();
  };

  const handleMarkPaid = async (id) => {
    await markPaymentPaid(id);
    load();
  };

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Payments</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Record Payment</button>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["all", "pending", "paid", "overdue"].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Resident</th>
              <th>Unit</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="empty">No payments found</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.resident_name}</strong></td>
                <td>{p.unit_number ? `Unit ${p.unit_number}` : "—"}</td>
                <td><span className={`badge ${typeBadge[p.payment_type] || "badge-gray"}`}>{typeLabel[p.payment_type]}</span></td>
                <td>${parseFloat(p.amount).toLocaleString()}</td>
                <td>{p.due_date}</td>
                <td>{p.paid_date || "—"}</td>
                <td><span className={`badge ${statusBadge[p.status] || "badge-gray"}`}>{p.status}</span></td>
                <td>
                  <div className="actions">
                    {p.status !== "paid" && (
                      <button className="btn btn-sm btn-success" onClick={() => handleMarkPaid(p.id)}>Mark Paid</button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <PaymentModal residents={residents} onClose={() => setModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
