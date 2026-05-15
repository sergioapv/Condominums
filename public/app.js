// ── Helpers ──────────────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ── Connection status ─────────────────────────────────────────────────────────

function setStatus(state, label, detail = '') {
  const el = $('#conn-status');
  el.className = 'conn-status ' + state;
  $('.conn-label', el).textContent = label;
  let d = $('.conn-detail', el);
  if (detail) {
    if (!d) { d = document.createElement('div'); d.className = 'conn-detail'; el.appendChild(d); }
    d.textContent = detail;
  } else if (d) {
    d.remove();
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  $('#app').classList.remove('hidden');
  setStatus('', 'Checking…');
  try {
    await api('/dashboard');
    setStatus('ok', 'Connected');
    router();
    window.addEventListener('hashchange', router);
  } catch (err) {
    if (err.message.includes('503') || err.message.includes('not set')) {
      $('#app').classList.add('hidden');
      $('#setup').classList.remove('hidden');
    } else {
      setStatus('err', 'Backend error', err.message);
      router();
      window.addEventListener('hashchange', router);
    }
  }
})();

// ── Router ───────────────────────────────────────────────────────────────────

const pages = { '/': renderDashboard, '/units': renderUnits, '/residents': renderResidents, '/payments': renderPayments };

function router() {
  const path = location.hash.replace('#', '') || '/';
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + path));
  (pages[path] || renderDashboard)();
}

function reload() { (pages[location.hash.replace('#', '') || '/'] || renderDashboard)(); }

// ── Modal ────────────────────────────────────────────────────────────────────

function openModal(html) {
  $('#modal').innerHTML = html;
  $('#overlay').classList.remove('hidden');
  $('#overlay').onclick = (e) => { if (e.target === $('#overlay')) closeModal(); };
}

function closeModal() {
  $('#overlay').classList.add('hidden');
  $('#modal').innerHTML = '';
}

function modalForm({ title, fields, onSubmit, submitLabel = 'Save' }) {
  openModal(`
    <h3>${esc(title)}</h3>
    <form id="mf">
      <div class="form-grid">
        ${fields.map(f => {
          const cls = `form-group${f.wide ? ' wide' : ''}`;
          if (f.type === 'select') return `<div class="${cls}">
            <label>${esc(f.label)}</label>
            <select name="${esc(f.name)}" ${f.required ? 'required' : ''}>
              ${f.blank ? `<option value="">— ${esc(f.blank)} —</option>` : ''}
              ${(f.options || []).map(o => `<option value="${esc(o.value)}" ${String(f.value) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select></div>`;
          if (f.type === 'textarea') return `<div class="${cls}">
            <label>${esc(f.label)}</label>
            <textarea name="${esc(f.name)}">${esc(f.value ?? '')}</textarea></div>`;
          return `<div class="${cls}">
            <label>${esc(f.label)}</label>
            <input type="${f.type || 'text'}" name="${esc(f.name)}" value="${esc(f.value ?? '')}" ${f.required ? 'required' : ''}></div>`;
        }).join('')}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${esc(submitLabel)}</button>
      </div>
    </form>
  `);
  $('#mf').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const btn = $('[type=submit]', $('#mf'));
    btn.disabled = true; btn.textContent = 'Saving…';
    try { await onSubmit(data); closeModal(); reload(); }
    catch (err) { alert(err.message); btn.disabled = false; btn.textContent = submitLabel; }
  };
}

// ── Badges ───────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  occupied: '<span class="badge badge-green">Occupied</span>',
  vacant:   '<span class="badge badge-yellow">Vacant</span>',
  active:   '<span class="badge badge-green">Active</span>',
  inactive: '<span class="badge badge-gray">Inactive</span>',
  paid:     '<span class="badge badge-green">Paid</span>',
  pending:  '<span class="badge badge-yellow">Pending</span>',
  overdue:  '<span class="badge badge-red">Overdue</span>',
};
const TYPE_BADGE = {
  monthly_fee:        '<span class="badge badge-blue">Monthly Fee</span>',
  special_assessment: '<span class="badge badge-orange">Special Assmt.</span>',
  late_fee:           '<span class="badge badge-red">Late Fee</span>',
};

// ── Error renderer ───────────────────────────────────────────────────────────

function showError(err) {
  setStatus('err', 'Backend error', err.message);
  $('#content').innerHTML = `
    <div class="error-state">
      <p>⚠️ Failed to load data</p>
      <p class="error-detail">${esc(err.message)}</p>
      <button class="btn btn-outline" onclick="reload()">Retry</button>
    </div>`;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

async function renderDashboard() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  let s;
  try { s = await api('/dashboard'); } catch (err) { return showError(err); }
  $('#content').innerHTML = `
    <div class="page-header"><h2>Dashboard</h2></div>
    <div class="stats-grid">
      ${stat('Total Units',      s.total_units)}
      ${stat('Occupied',         s.occupied,    'green')}
      ${stat('Vacant',           s.vacant,      'orange')}
      ${stat('Active Residents', s.residents)}
      ${stat('Pending Payments', s.pending,     'orange')}
      ${stat('Overdue',          s.overdue,     'red')}
      ${stat('Collected',        fmt(s.collected),   'green')}
      ${stat('Outstanding',      fmt(s.outstanding), 'red')}
    </div>`;
}

function stat(label, value, color = '') {
  return `<div class="stat-card">
    <div class="stat-label">${esc(label)}</div>
    <div class="stat-value ${esc(color)}">${esc(String(value))}</div>
  </div>`;
}

// ── Units ────────────────────────────────────────────────────────────────────

async function renderUnits() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  let units;
  try { units = await api('/units'); } catch (err) { return showError(err); }
  const rows = units.map(u => `<tr>
    <td class="cell-name">${esc(u.number)}</td>
    <td>${esc(u.floor)}</td>
    <td><span class="badge badge-gray">${esc(u.unit_type)}</span></td>
    <td>${esc(u.size_sqft)} sqft</td>
    <td>${fmt(u.monthly_fee)}</td>
    <td>${STATUS_BADGE[u.status] ?? esc(u.status)}</td>
    <td>${esc(u.resident_count)}</td>
    <td class="actions">
      <button class="btn btn-sm btn-outline" data-edit="${esc(u.id)}">Edit</button>
      <button class="btn btn-sm btn-danger"  data-del="${esc(u.id)}">Delete</button>
    </td></tr>`);

  $('#content').innerHTML = `
    <div class="page-header">
      <h2>Units</h2>
      <button class="btn btn-primary" id="add-btn">+ Add Unit</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Unit</th><th>Floor</th><th>Type</th><th>Size</th><th>Monthly Fee</th><th>Status</th><th>Residents</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="8">No units yet</td></tr>'}</tbody>
    </table></div>`;

  const map = Object.fromEntries(units.map(u => [String(u.id), u]));
  $('#add-btn').onclick = () => unitForm(null);
  $$('[data-edit]').forEach(b => b.onclick = () => unitForm(map[b.dataset.edit]));
  $$('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Delete this unit?')) return;
    await api(`/units?id=${b.dataset.del}`, { method: 'DELETE' });
    reload();
  });
}

function unitForm(u) {
  modalForm({
    title: u ? 'Edit Unit' : 'Add Unit',
    fields: [
      { name: 'number',      label: 'Unit Number',  value: u?.number,      required: true },
      { name: 'floor',       label: 'Floor',        value: u?.floor,       required: true, type: 'number' },
      { name: 'unit_type',   label: 'Type',         value: u?.unit_type,   type: 'select',
        options: [{value:'studio',label:'Studio'},{value:'1br',label:'1 Bedroom'},{value:'2br',label:'2 Bedrooms'},{value:'3br',label:'3 Bedrooms'}] },
      { name: 'size_sqft',   label: 'Size (sqft)',  value: u?.size_sqft,   required: true, type: 'number' },
      { name: 'monthly_fee', label: 'Monthly Fee',  value: u?.monthly_fee, required: true, type: 'number' },
      { name: 'status',      label: 'Status',       value: u?.status ?? 'vacant', type: 'select',
        options: [{value:'vacant',label:'Vacant'},{value:'occupied',label:'Occupied'}] },
    ],
    onSubmit: (data) => {
      const body = { ...data, floor: +data.floor, size_sqft: +data.size_sqft, monthly_fee: +data.monthly_fee };
      return u
        ? api(`/units?id=${u.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : api('/units',            { method: 'POST',  body: JSON.stringify(body) });
    },
  });
}

// ── Residents ────────────────────────────────────────────────────────────────

async function renderResidents() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  let residents, units;
  try { [residents, units] = await Promise.all([api('/residents'), api('/units')]); } catch (err) { return showError(err); }
  const rows = residents.map(r => `<tr>
    <td class="cell-name">${esc(r.first_name)} ${esc(r.last_name)}</td>
    <td>${esc(r.email)}</td>
    <td class="cell-muted">${esc(r.phone || '—')}</td>
    <td>${r.unit_number ? `Unit ${esc(r.unit_number)}` : '<span class="cell-muted">—</span>'}</td>
    <td>${esc(r.move_in_date)}</td>
    <td>${STATUS_BADGE[r.status] ?? esc(r.status)}</td>
    <td class="actions">
      <button class="btn btn-sm btn-outline" data-edit="${esc(r.id)}">Edit</button>
      <button class="btn btn-sm btn-danger"  data-del="${esc(r.id)}">Delete</button>
    </td></tr>`);

  $('#content').innerHTML = `
    <div class="page-header">
      <h2>Residents</h2>
      <button class="btn btn-primary" id="add-btn">+ Add Resident</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Unit</th><th>Move-in</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="7">No residents yet</td></tr>'}</tbody>
    </table></div>`;

  const map = Object.fromEntries(residents.map(r => [String(r.id), r]));
  $('#add-btn').onclick = () => residentForm(null, units);
  $$('[data-edit]').forEach(b => b.onclick = () => residentForm(map[b.dataset.edit], units));
  $$('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Delete this resident?')) return;
    await api(`/residents?id=${b.dataset.del}`, { method: 'DELETE' });
    reload();
  });
}

function residentForm(r, units) {
  modalForm({
    title: r ? 'Edit Resident' : 'Add Resident',
    fields: [
      { name: 'first_name',    label: 'First Name',    value: r?.first_name,    required: true },
      { name: 'last_name',     label: 'Last Name',     value: r?.last_name,     required: true },
      { name: 'email',         label: 'Email',         value: r?.email,         required: true, type: 'email', wide: true },
      { name: 'phone',         label: 'Phone',         value: r?.phone },
      { name: 'unit_id',       label: 'Unit',          value: r?.unit_id,       type: 'select', blank: 'No unit',
        options: units.map(u => ({ value: u.id, label: `Unit ${u.number} (${u.unit_type})` })) },
      { name: 'move_in_date',  label: 'Move-in Date',  value: r?.move_in_date,  required: true, type: 'date' },
      { name: 'move_out_date', label: 'Move-out Date', value: r?.move_out_date, type: 'date' },
      { name: 'status',        label: 'Status',        value: r?.status ?? 'active', type: 'select',
        options: [{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}] },
    ],
    onSubmit: (data) => {
      const body = { ...data, unit_id: data.unit_id || null, move_out_date: data.move_out_date || null };
      return r
        ? api(`/residents?id=${r.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : api('/residents',            { method: 'POST',  body: JSON.stringify(body) });
    },
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────

let payFilter = 'all';

async function renderPayments() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  let all, residents;
  try { [all, residents] = await Promise.all([api('/payments'), api('/residents')]); } catch (err) { return showError(err); }
  const payments = payFilter === 'all' ? all : all.filter(p => p.status === payFilter);

  const rows = payments.map(p => `<tr>
    <td class="cell-name">${esc(p.resident_name)}</td>
    <td class="cell-muted">${p.unit_number ? `Unit ${esc(p.unit_number)}` : '—'}</td>
    <td>${TYPE_BADGE[p.payment_type] ?? esc(p.payment_type)}</td>
    <td>${fmt(p.amount)}</td>
    <td>${esc(p.due_date)}</td>
    <td class="cell-muted">${esc(p.paid_date || '—')}</td>
    <td>${STATUS_BADGE[p.status] ?? esc(p.status)}</td>
    <td class="actions">
      ${p.status !== 'paid' ? `<button class="btn btn-sm btn-success" data-pay="${esc(p.id)}">Mark Paid</button>` : ''}
      <button class="btn btn-sm btn-danger" data-del="${esc(p.id)}">Delete</button>
    </td></tr>`);

  $('#content').innerHTML = `
    <div class="page-header">
      <h2>Payments</h2>
      <button class="btn btn-primary" id="add-btn">+ Record Payment</button>
    </div>
    <div class="filter-bar">
      ${['all','pending','paid','overdue'].map(f =>
        `<button class="btn btn-sm btn-filter ${payFilter===f?'active':''}" data-filter="${f}">${f[0].toUpperCase()+f.slice(1)}</button>`
      ).join('')}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Resident</th><th>Unit</th><th>Type</th><th>Amount</th><th>Due</th><th>Paid</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="8">No payments</td></tr>'}</tbody>
    </table></div>`;

  $('#add-btn').onclick = () => paymentForm(residents);

  $$('[data-filter]').forEach(b => b.onclick = () => { payFilter = b.dataset.filter; renderPayments(); });

  $$('[data-pay]').forEach(b => b.onclick = async () => {
    await api(`/payments?id=${b.dataset.pay}`, { method: 'POST', body: JSON.stringify({ _action: 'mark-paid' }) });
    reload();
  });

  $$('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Delete this payment?')) return;
    await api(`/payments?id=${b.dataset.del}`, { method: 'DELETE' });
    reload();
  });
}

function paymentForm(residents) {
  modalForm({
    title: 'Record Payment',
    fields: [
      { name: 'resident_id',  label: 'Resident',    required: true, type: 'select', wide: true, blank: 'Select resident',
        options: residents.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name}${r.unit_number ? ` — Unit ${r.unit_number}` : ''}` })) },
      { name: 'payment_type', label: 'Type', type: 'select',
        options: [{value:'monthly_fee',label:'Monthly Fee'},{value:'special_assessment',label:'Special Assessment'},{value:'late_fee',label:'Late Fee'}] },
      { name: 'amount',    label: 'Amount ($)', required: true, type: 'number' },
      { name: 'due_date',  label: 'Due Date',   required: true, type: 'date' },
      { name: 'status',    label: 'Status', type: 'select',
        options: [{value:'pending',label:'Pending'},{value:'paid',label:'Paid'},{value:'overdue',label:'Overdue'}] },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
    onSubmit: (data) => api('/payments', { method: 'POST', body: JSON.stringify({ ...data, amount: +data.amount, notes: data.notes || '' }) }),
  });
}
