// Shared Supabase REST helper — runs server-side only, keys never reach the browser.
const URL  = process.env.SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function sb(path, { method = 'GET', body } = {}) {
  if (!URL || !KEY) throw Object.assign(new Error('Supabase env vars not set'), { status: 503 });

  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw Object.assign(new Error(data?.message || `HTTP ${res.status}`), { status: res.status });
  return data;
};
