const sb = require('./_sb');
const json  = (d)   => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
const error = (err) => ({ statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) });

exports.handler = async (event) => {
  const { httpMethod: method, queryStringParameters: qs, body } = event;
  const id = qs?.id;

  try {
    if (method === 'GET') {
      const rows = await sb('payments?select=*,residents(first_name,last_name,units(number))&order=due_date.desc');
      return json((rows || []).map(p => ({
        ...p,
        resident_name: p.residents ? `${p.residents.first_name} ${p.residents.last_name}` : '—',
        unit_number:   p.residents?.units?.number ?? null,
        residents:     undefined,
      })));
    }
    if (method === 'POST') {
      const payload = JSON.parse(body);
      // mark-paid action
      if (payload._action === 'mark-paid') {
        const data = await sb(`payments?id=eq.${id}`, {
          method: 'PATCH',
          body: { status: 'paid', paid_date: new Date().toISOString().split('T')[0] },
        });
        return json(data);
      }
      const data = await sb('payments', { method: 'POST', body: payload });
      return json(data);
    }
    if (method === 'DELETE') {
      await sb(`payments?id=eq.${id}`, { method: 'DELETE' });
      return json({ ok: true });
    }
    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    return error(err);
  }
};
