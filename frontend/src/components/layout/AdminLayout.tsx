/**
 * Chrome for staff admin pages. Separate nav from the patient AppLayout.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const navItems = [
  { to: '/admin', label: 'Patients', end: true },
  { to: '/admin/register', label: 'Register Admin', end: false },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark admin-mark">A</span>
          <div>
            <p className="brand-title">Med Life Admin</p>
            <p className="brand-subtitle">Patient overview & diet plans</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="user-badge staff-badge">{user?.username} · staff</span>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
