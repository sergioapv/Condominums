const sb = require('./_sb');
const json  = (d)   => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
const error = (err) => ({ statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) });

exports.handler = async (event) => {
  const { httpMethod: method, queryStringParameters: qs, body } = event;
  const id = qs?.id;

  try {
    if (method === 'GET') {
      const rows = await sb('units?select=*,residents(id,status)&order=floor.asc,number.asc');
      return json((rows || []).map(u => ({
        ...u,
        resident_count: (u.residents || []).filter(r => r.status === 'active').length,
        residents: undefined,
      })));
    }
    if (method === 'POST') {
      const data = await sb('units', { method: 'POST', body: JSON.parse(body) });
      return json(data);
    }
    if (method === 'PATCH') {
      const data = await sb(`units?id=eq.${id}`, { method: 'PATCH', body: JSON.parse(body) });
      return json(data);
    }
    if (method === 'DELETE') {
      await sb(`units?id=eq.${id}`, { method: 'DELETE' });
      return json({ ok: true });
    }
    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    return error(err);
  }
};
