// ── Init ─────────────────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

let db;

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
  $('#setup').classList.remove('hidden');
} else {
  db = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  $('#app').classList.remove('hidden');
  setupRealtime();
  router();
  window.addEventListener('hashchange', router);
}

// ── Router ───────────────────────────────────────────────────────────────────

const pages = {
  '/':          renderDashboard,
  '/units':     renderUnits,
  '/residents': renderResidents,
  '/payments':  renderPayments,
};

function router() {
  const path = location.hash.replace('#', '') || '/';
  $$('.nav-item').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + path);
  });
  const render = pages[path] || renderDashboard;
  render();
}

// ── Realtime ─────────────────────────────────────────────────────────────────

function setupRealtime() {
  db.channel('all-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      const path = location.hash.replace('#', '') || '/';
      const render = pages[path];
      if (render) render();
    })
    .subscribe();
}

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
          if (f.type === 'select') {
            return `<div class="form-group ${f.wide ? 'wide' : ''}">
              <label>${esc(f.label)}</label>
              <select name="${esc(f.name)}" ${f.required ? 'required' : ''}>
                ${f.blank ? `<option value="">— ${esc(f.blank)} —</option>` : ''}
                ${f.options.map(o => `<option value="${esc(o.value)}" ${String(f.value) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
              </select>
            </div>`;
          }
          if (f.type === 'textarea') {
            return `<div class="form-group ${f.wide ? 'wide' : ''}">
              <label>${esc(f.label)}</label>
              <textarea name="${esc(f.name)}">${esc(f.value ?? '')}</textarea>
            </div>`;
          }
          return `<div class="form-group ${f.wide ? 'wide' : ''}">
            <label>${esc(f.label)}</label>
            <input type="${f.type || 'text'}" name="${esc(f.name)}" value="${esc(f.value ?? '')}" ${f.required ? 'required' : ''}>
          </div>`;
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
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try { await onSubmit(data); closeModal(); } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.textContent = submitLabel;
    }
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

// ── Dashboard ────────────────────────────────────────────────────────────────

async function renderDashboard() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  const [u, r, p] = await Promise.all([
    db.from('units').select('status'),
    db.from('residents').select('status'),
    db.from('payments').select('status, amount'),
  ]);
  const units = u.data || [], residents = r.data || [], payments = p.data || [];
  const s = {
    total:       units.length,
    occupied:    units.filter(x => x.status === 'occupied').length,
    vacant:      units.filter(x => x.status === 'vacant').length,
    residents:   residents.filter(x => x.status === 'active').length,
    pending:     payments.filter(x => x.status === 'pending').length,
    overdue:     payments.filter(x => x.status === 'overdue').length,
    collected:   payments.filter(x => x.status === 'paid').reduce((a, x) => a + +x.amount, 0),
    outstanding: payments.filter(x => x.status !== 'paid').reduce((a, x) => a + +x.amount, 0),
  };

  $('#content').innerHTML = `
    <div class="page-header"><h2>Dashboard</h2></div>
    <div class="stats-grid">
      ${stat('Total Units',       s.total)}
      ${stat('Occupied',          s.occupied,    'green')}
      ${stat('Vacant',            s.vacant,      'orange')}
      ${stat('Active Residents',  s.residents)}
      ${stat('Pending Payments',  s.pending,     'orange')}
      ${stat('Overdue',           s.overdue,     'red')}
      ${stat('Collected',         fmt(s.collected),    'green')}
      ${stat('Outstanding',       fmt(s.outstanding),  'red')}
    </div>
  `;
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
  const { data: units } = await db
    .from('units')
    .select('*, residents(id, status)')
    .order('floor').order('number');

  const rows = (units || []).map(u => {
    const active = (u.residents || []).filter(r => r.status === 'active').length;
    return `<tr>
      <td class="cell-name">${esc(u.number)}</td>
      <td>${esc(u.floor)}</td>
      <td><span class="badge badge-gray">${esc(u.unit_type)}</span></td>
      <td>${esc(u.size_sqft)} sqft</td>
      <td>${fmt(u.monthly_fee)}</td>
      <td>${STATUS_BADGE[u.status] ?? esc(u.status)}</td>
      <td>${esc(active)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-outline" data-edit-unit="${esc(u.id)}">Edit</button>
        <button class="btn btn-sm btn-danger"  data-del-unit="${esc(u.id)}">Delete</button>
      </td>
    </tr>`;
  });

  $('#content').innerHTML = `
    <div class="page-header">
      <h2>Units</h2>
      <button class="btn btn-primary" id="add-unit">+ Add Unit</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Unit</th><th>Floor</th><th>Type</th><th>Size</th>
          <th>Monthly Fee</th><th>Status</th><th>Residents</th><th></th>
        </tr></thead>
        <tbody>${rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="8">No units yet</td></tr>'}</tbody>
      </table>
    </div>
  `;

  $('#add-unit').onclick = () => unitForm(null);

  const unitMap = Object.fromEntries((units || []).map(u => [u.id, u]));
  $$('[data-edit-unit]').forEach(btn => btn.onclick = () => unitForm(unitMap[btn.dataset.editUnit]));
  $$('[data-del-unit]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete this unit?')) return;
    await db.from('units').delete().eq('id', btn.dataset.delUnit);
  });
}

function unitForm(u) {
  modalForm({
    title: u ? 'Edit Unit' : 'Add Unit',
    fields: [
      { name: 'number',      label: 'Unit Number',  value: u?.number,      required: true },
      { name: 'floor',       label: 'Floor',        value: u?.floor,       required: true, type: 'number' },
      { name: 'unit_type',   label: 'Type',         value: u?.unit_type,   type: 'select', options: [
          { value: 'studio', label: 'Studio' },
          { value: '1br',    label: '1 Bedroom' },
          { value: '2br',    label: '2 Bedrooms' },
          { value: '3br',    label: '3 Bedrooms' },
      ]},
      { name: 'size_sqft',   label: 'Size (sqft)',  value: u?.size_sqft,   required: true, type: 'number' },
      { name: 'monthly_fee', label: 'Monthly Fee',  value: u?.monthly_fee, required: true, type: 'number' },
      { name: 'status',      label: 'Status',       value: u?.status ?? 'vacant', type: 'select', options: [
          { value: 'vacant',   label: 'Vacant' },
          { value: 'occupied', label: 'Occupied' },
      ]},
    ],
    onSubmit: async (data) => {
      const payload = { ...data, floor: +data.floor, size_sqft: +data.size_sqft, monthly_fee: +data.monthly_fee };
      if (u) await db.from('units').update(payload).eq('id', u.id);
      else    await db.from('units').insert(payload);
    },
  });
}

// ── Residents ────────────────────────────────────────────────────────────────

async function renderResidents() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  const [resRes, unitRes] = await Promise.all([
    db.from('residents').select('*, units(number)').order('last_name').order('first_name'),
    db.from('units').select('id, number, unit_type').order('number'),
  ]);
  const residents = resRes.data || [];
  const units = unitRes.data || [];

  const rows = residents.map(r => `<tr>
    <td class="cell-name">${esc(r.first_name)} ${esc(r.last_name)}</td>
    <td>${esc(r.email)}</td>
    <td class="cell-muted">${esc(r.phone || '—')}</td>
    <td>${r.units ? `Unit ${esc(r.units.number)}` : '<span class="cell-muted">—</span>'}</td>
    <td>${esc(r.move_in_date)}</td>
    <td>${STATUS_BADGE[r.status] ?? esc(r.status)}</td>
    <td class="actions">
      <button class="btn btn-sm btn-outline" data-edit-res="${esc(r.id)}">Edit</button>
      <button class="btn btn-sm btn-danger"  data-del-res="${esc(r.id)}">Delete</button>
    </td>
  </tr>`);

  $('#content').innerHTML = `
    <div class="page-header">
      <h2>Residents</h2>
      <button class="btn btn-primary" id="add-res">+ Add Resident</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Name</th><th>Email</th><th>Phone</th>
          <th>Unit</th><th>Move-in</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>${rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="7">No residents yet</td></tr>'}</tbody>
      </table>
    </div>
  `;

  $('#add-res').onclick = () => residentForm(null, units);
  const resMap = Object.fromEntries(residents.map(r => [r.id, r]));
  $$('[data-edit-res]').forEach(btn => btn.onclick = () => residentForm(resMap[btn.dataset.editRes], units));
  $$('[data-del-res]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete this resident?')) return;
    await db.from('residents').delete().eq('id', btn.dataset.delRes);
  });
}

function residentForm(r, units) {
  modalForm({
    title: r ? 'Edit Resident' : 'Add Resident',
    fields: [
      { name: 'first_name',    label: 'First Name',   value: r?.first_name,    required: true },
      { name: 'last_name',     label: 'Last Name',    value: r?.last_name,     required: true },
      { name: 'email',         label: 'Email',        value: r?.email,         required: true, type: 'email', wide: true },
      { name: 'phone',         label: 'Phone',        value: r?.phone },
      { name: 'unit_id',       label: 'Unit',         value: r?.unit_id, type: 'select', blank: 'No unit',
        options: units.map(u => ({ value: u.id, label: `Unit ${u.number} (${u.unit_type})` })) },
      { name: 'move_in_date',  label: 'Move-in Date', value: r?.move_in_date,  required: true, type: 'date' },
      { name: 'move_out_date', label: 'Move-out Date',value: r?.move_out_date, type: 'date' },
      { name: 'status',        label: 'Status',       value: r?.status ?? 'active', type: 'select',
        options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    ],
    onSubmit: async (data) => {
      const payload = { ...data, unit_id: data.unit_id || null, move_out_date: data.move_out_date || null };
      if (r) await db.from('residents').update(payload).eq('id', r.id);
      else    await db.from('residents').insert(payload);
    },
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────

let payFilter = 'all';

async function renderPayments() {
  $('#content').innerHTML = '<div class="loading">Loading…</div>';
  const [payRes, resRes] = await Promise.all([
    db.from('payments').select('*, residents(first_name, last_name, units(number))').order('due_date', { ascending: false }),
    db.from('residents').select('id, first_name, last_name, units(number)').order('last_name'),
  ]);
  const all      = payRes.data || [];
  const residents = resRes.data || [];
  const payments = payFilter === 'all' ? all : all.filter(p => p.status === payFilter);

  const rows = payments.map(p => {
    const rName = p.residents ? `${p.residents.first_name} ${p.residents.last_name}` : '—';
    const uNum  = p.residents?.units?.number;
    return `<tr>
      <td class="cell-name">${esc(rName)}</td>
      <td class="cell-muted">${uNum ? `Unit ${esc(uNum)}` : '—'}</td>
      <td>${TYPE_BADGE[p.payment_type] ?? esc(p.payment_type)}</td>
      <td>${fmt(p.amount)}</td>
      <td>${esc(p.due_date)}</td>
      <td class="cell-muted">${esc(p.paid_date || '—')}</td>
      <td>${STATUS_BADGE[p.status] ?? esc(p.status)}</td>
      <td class="actions">
        ${p.status !== 'paid' ? `<button class="btn btn-sm btn-success" data-pay="${esc(p.id)}">Mark Paid</button>` : ''}
        <button class="btn btn-sm btn-danger" data-del-pay="${esc(p.id)}">Delete</button>
      </td>
    </tr>`;
  });

  const filters = ['all', 'pending', 'paid', 'overdue'];

  $('#content').innerHTML = `
    <div class="page-header">
      <h2>Payments</h2>
      <button class="btn btn-primary" id="add-pay">+ Record Payment</button>
    </div>
    <div class="filter-bar">
      ${filters.map(f => `<button class="btn btn-sm btn-filter ${payFilter === f ? 'active' : ''}" data-filter="${esc(f)}">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('')}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Resident</th><th>Unit</th><th>Type</th><th>Amount</th>
          <th>Due</th><th>Paid</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>${rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="8">No payments</td></tr>'}</tbody>
      </table>
    </div>
  `;

  $('#add-pay').onclick = () => paymentForm(residents);

  $$('[data-filter]').forEach(btn => btn.onclick = () => {
    payFilter = btn.dataset.filter;
    renderPayments();
  });

  $$('[data-pay]').forEach(btn => btn.onclick = async () => {
    const today = new Date().toISOString().split('T')[0];
    await db.from('payments').update({ status: 'paid', paid_date: today }).eq('id', btn.dataset.pay);
  });

  $$('[data-del-pay]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete this payment?')) return;
    await db.from('payments').delete().eq('id', btn.dataset.delPay);
  });
}

function paymentForm(residents) {
  modalForm({
    title: 'Record Payment',
    fields: [
      { name: 'resident_id', label: 'Resident', required: true, type: 'select', wide: true, blank: 'Select resident',
        options: residents.map(r => ({
          value: r.id,
          label: `${r.first_name} ${r.last_name}${r.units ? ` — Unit ${r.units.number}` : ''}`,
        }))
      },
      { name: 'payment_type', label: 'Type', type: 'select',
        options: [
          { value: 'monthly_fee',        label: 'Monthly Fee' },
          { value: 'special_assessment', label: 'Special Assessment' },
          { value: 'late_fee',           label: 'Late Fee' },
        ]
      },
      { name: 'amount',   label: 'Amount ($)', required: true, type: 'number' },
      { name: 'due_date', label: 'Due Date',   required: true, type: 'date' },
      { name: 'status',   label: 'Status', type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid',    label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
        ]
      },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
    onSubmit: async (data) => {
      await db.from('payments').insert({ ...data, amount: +data.amount, notes: data.notes || '' });
    },
  });
}
