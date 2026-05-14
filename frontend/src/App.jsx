import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { isConfigured } from "./supabase";
import Dashboard from "./pages/Dashboard";
import Units from "./pages/Units";
import Residents from "./pages/Residents";
import Payments from "./pages/Payments";
import "./App.css";

function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>Condominums</h1>
        <p className="setup-subtitle">Supabase is not configured yet.</p>
        <ol>
          <li>Create a project at <strong>supabase.com</strong></li>
          <li>Run <code>supabase/schema.sql</code> in the SQL Editor</li>
          <li>
            Create <code>frontend/.env.local</code> with:
            <pre>{`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
          </li>
          <li>Restart the dev server</li>
        </ol>
      </div>
    </div>
  );
}

function App() {
  if (!isConfigured) return <SetupScreen />;

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>Condominums</h1>
            <p>Management System</p>
          </div>
          <ul className="nav-links">
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            <li><NavLink to="/units">Units</NavLink></li>
            <li><NavLink to="/residents">Residents</NavLink></li>
            <li><NavLink to="/payments">Payments</NavLink></li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/units" element={<Units />} />
            <Route path="/residents" element={<Residents />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
