const sb = require('./_sb');

exports.handler = async () => {
  try {
    const [u, r, p] = await Promise.all([
      sb('units?select=status'),
      sb('residents?select=status'),
      sb('payments?select=status,amount'),
    ]);
    const units = u || [], residents = r || [], payments = p || [];
    return json({
      total_units:      units.length,
      occupied:         units.filter(x => x.status === 'occupied').length,
      vacant:           units.filter(x => x.status === 'vacant').length,
      residents:        residents.filter(x => x.status === 'active').length,
      pending:          payments.filter(x => x.status === 'pending').length,
      overdue:          payments.filter(x => x.status === 'overdue').length,
      collected:        payments.filter(x => x.status === 'paid').reduce((a, x) => a + +x.amount, 0),
      outstanding:      payments.filter(x => x.status !== 'paid').reduce((a, x) => a + +x.amount, 0),
    });
  } catch (err) {
    return error(err);
  }
};

const json  = (data) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const error = (err)  => ({ statusCode: err.status || 500, body: JSON.stringify({ error: err.message }) });
