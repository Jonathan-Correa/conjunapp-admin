import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Building2, CalendarDays, LayoutDashboard, LogOut, Receipt, Users } from "lucide-react";
import { useAuthStore } from "../store/auth";
import type { ReactNode } from "react";

const tabs = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/residents", label: "Residentes", icon: Users },
  { to: "/dashboard/invoices", label: "Facturas", icon: Receipt },
  { to: "/dashboard/reservations", label: "Reservas", icon: CalendarDays },
  { to: "/dashboard/announcements", label: "Anuncios", icon: Bell },
];

type Props = {
  children: ReactNode;
};

export function AdminLayout({ children }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-header__brand">
            <Building2 size={28} />
            <div>
              <h1>ConjunApp Admin</h1>
              <p>Portal de Administración</p>
            </div>
          </div>
          <div className="admin-header__user">
            <div className="admin-header__user-meta">
              <p>{user?.full_name}</p>
              <span>{user?.position}</span>
            </div>
            <button type="button" className="admin-header__logout" onClick={handleLogout}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <nav className="admin-tabs" aria-label="Secciones">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-tab${isActive ? " is-active" : ""}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}
