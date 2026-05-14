import { useState, useEffect } from "react";
import { getResidents, getUnits, createResident, updateResident, deleteResident } from "../api";

const EMPTY_FORM = {
  first_name: "", last_name: "", email: "", phone: "",
  unit: "", move_in_date: "", move_out_date: "", status: "active",
};

function ResidentModal({ resident, units, onClose, onSave }) {
  const [form, setForm] = useState(
    resident
      ? { ...resident, unit: resident.unit || "" }
      : EMPTY_FORM
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, unit: form.unit || null };
    await onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{resident ? "Edit Resident" : "Add Resident"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                <option value="">— No unit assigned —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>Unit {u.number} ({u.unit_type})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Move-in Date</label>
              <input required type="date" value={form.move_in_date} onChange={(e) => set("move_in_date", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Move-out Date</label>
              <input type="date" value={form.move_out_date || ""} onChange={(e) => set("move_out_date", e.target.value || null)} />
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

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [modal, setModal] = useState(null);

  const load = () => {
    getResidents().then((r) => setResidents(r.data));
    getUnits().then((r) => setUnits(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (modal?.id) {
      await updateResident(modal.id, form);
    } else {
      await createResident(form);
    }
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resident?")) return;
    await deleteResident(id);
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Residents</h2>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Add Resident</button>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Unit</th>
              <th>Move-in</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {residents.length === 0 && (
              <tr><td colSpan="7" className="empty">No residents found</td></tr>
            )}
            {residents.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.first_name} {r.last_name}</strong></td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td>{r.unit_number ? `Unit ${r.unit_number}` : <span style={{color:"#a0aec0"}}>—</span>}</td>
                <td>{r.move_in_date}</td>
                <td>
                  <span className={`badge ${r.status === "active" ? "badge-green" : "badge-gray"}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn btn-sm btn-outline" onClick={() => setModal(r)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal !== null && (
        <ResidentModal
          resident={modal.id ? modal : null}
          units={units}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
