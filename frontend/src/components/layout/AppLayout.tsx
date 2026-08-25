/**
 * Chrome for authenticated pages. Renders the top nav (Dashboard, Health Profile,
 * Health Plan, Dietary, Prescription), the current username, and a Logout button
 * that calls AuthContext.logout(). Child routes render in <Outlet />.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/health-profile', label: 'Health Profile' },
  { to: '/health-plan', label: 'Health Plan' },
  { to: '/dietary', label: 'Dietary' },
  { to: '/prescription', label: 'Prescription' },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">+</span>
          <div>
            <p className="brand-title">Med Life AI</p>
            <p className="brand-subtitle">Medication & wellness companion</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="user-badge">{user?.username}</span>
          <Button variant="ghost" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
