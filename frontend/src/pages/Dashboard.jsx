import { useState, useEffect } from "react";
import { getDashboardStats } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then((r) => setStats(r.data)).catch(console.error);
  }, []);

  if (!stats) return <div className="loading">Loading...</div>;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Units</div>
          <div className="value">{stats.total_units}</div>
        </div>
        <div className="stat-card">
          <div className="label">Occupied</div>
          <div className="value green">{stats.occupied_units}</div>
        </div>
        <div className="stat-card">
          <div className="label">Vacant</div>
          <div className="value orange">{stats.vacant_units}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Residents</div>
          <div className="value">{stats.total_residents}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pending Payments</div>
          <div className="value orange">{stats.pending_payments}</div>
        </div>
        <div className="stat-card">
          <div className="label">Overdue Payments</div>
          <div className="value red">{stats.overdue_payments}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Collected</div>
          <div className="value green">{fmt(stats.total_collected)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Outstanding Balance</div>
          <div className="value red">{fmt(stats.total_pending_amount)}</div>
        </div>
      </div>
    </div>
  );
}
