const sb = require('./_sb');
const json  = (d)   => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
const error = (err) => ({ statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) });

exports.handler = async (event) => {
  const { httpMethod: method, queryStringParameters: qs, body } = event;
  const id = qs?.id;

  try {
    if (method === 'GET') {
      const rows = await sb('residents?select=*,units(number)&order=last_name.asc,first_name.asc');
      return json((rows || []).map(r => ({ ...r, unit_number: r.units?.number ?? null, units: undefined })));
    }
    if (method === 'POST') {
      const data = await sb('residents', { method: 'POST', body: JSON.parse(body) });
      return json(data);
    }
    if (method === 'PATCH') {
      const data = await sb(`residents?id=eq.${id}`, { method: 'PATCH', body: JSON.parse(body) });
      return json(data);
    }
    if (method === 'DELETE') {
      await sb(`residents?id=eq.${id}`, { method: 'DELETE' });
      return json({ ok: true });
    }
    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    return error(err);
  }
};
