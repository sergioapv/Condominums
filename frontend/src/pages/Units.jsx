import { useState, useEffect } from "react";
import { getUnits, createUnit, updateUnit, deleteUnit } from "../api";

const EMPTY_FORM = {
  number: "", floor: "", unit_type: "1br", size_sqft: "", monthly_fee: "", status: "vacant",
};

function UnitModal({ unit, onClose, onSave }) {
  const [form, setForm] = useState(unit || EMPTY_FORM);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{unit ? "Edit Unit" : "Add Unit"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Unit Number</label>
              <input required value={form.number} onChange={(e) => set("number", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Floor</label>
              <input required type="number" min="1" value={form.floor} onChange={(e) => set("floor", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.unit_type} onChange={(e) => set("unit_type", e.target.value)}>
                <option value="studio">Studio</option>
                <option value="1br">1 Bedroom</option>
                <option value="2br">2 Bedrooms</option>
                <option value="3br">3 Bedrooms</option>
              </select>
            </div>
            <div className="form-group">
              <label>Size (sqft)</label>
              <input required type="number" min="1" value={form.size_sqft} onChange={(e) => set("size_sqft", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Monthly Fee ($)</label>
              <input required type="number" min="0" step="0.01" value={form.monthly_fee} onChange={(e) => set("monthly_fee", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
              </select>
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

export default function Units() {
  const [units, setUnits] = useState([]);
  const [modal, setModal] = useState(null);

  const load = () => getUnits().then((r) => setUnits(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (modal?.id) {
      await updateUnit(modal.id, form);
    } else {
      await createUnit(form);
    }
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this unit?")) return;
    await deleteUnit(id);
    load();
  };

  const typeBadge = { studio: "badge-gray", "1br": "badge-blue", "2br": "badge-green", "3br": "badge-yellow" };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Units</h2>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Add Unit</button>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Unit</th>
              <th>Floor</th>
              <th>Type</th>
              <th>Size</th>
              <th>Monthly Fee</th>
              <th>Status</th>
              <th>Residents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 && (
              <tr><td colSpan="8" className="empty">No units found</td></tr>
            )}
            {units.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.number}</strong></td>
                <td>{u.floor}</td>
                <td><span className={`badge ${typeBadge[u.unit_type] || "badge-gray"}`}>{u.unit_type}</span></td>
                <td>{u.size_sqft} sqft</td>
                <td>${parseFloat(u.monthly_fee).toLocaleString()}</td>
                <td>
                  <span className={`badge ${u.status === "occupied" ? "badge-green" : "badge-yellow"}`}>
                    {u.status}
                  </span>
                </td>
                <td>{u.resident_count}</td>
                <td>
                  <div className="actions">
                    <button className="btn btn-sm btn-outline" onClick={() => setModal(u)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal !== null && (
        <UnitModal unit={modal.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
