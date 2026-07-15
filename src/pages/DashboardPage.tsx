import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
} from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { useAuthStore } from "../store/auth";
import {
  api,
  money,
  type AccountingReport,
  type Announcement,
  type CommonArea,
  type Dashboard,
  type Invoice,
  type Reservation,
  type Resident,
  type Unit,
} from "../lib/api";
import "../styles.css";

type DataState = {
  dashboard: Dashboard | null;
  residents: Resident[];
  units: Unit[];
  invoices: Invoice[];
  areas: CommonArea[];
  reservations: Reservation[];
  announcements: Announcement[];
  accounting: AccountingReport | null;
};

const initialData: DataState = {
  dashboard: null,
  residents: [],
  units: [],
  invoices: [],
  areas: [],
  reservations: [],
  announcements: [],
  accounting: null,
};

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "No se pudieron cargar los datos del dashboard.";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<DataState>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboard, residents, units, invoices, areas, reservations, announcements, accounting] =
        await Promise.all([
          api.dashboard(),
          api.residents(),
          api.units(),
          api.invoices(),
          api.commonAreas(),
          api.reservations(),
          api.announcements(),
          api.accountingReport(),
        ]);
      setData({
        dashboard,
        residents,
        units,
        invoices,
        areas,
        reservations,
        announcements,
        accounting,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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
        {error ? (
          <div className="admin-alert">
            <span>{error}</span>
            <button type="button" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        ) : null}

        <nav className="admin-tabs" aria-label="Secciones">
          <button type="button" className="admin-tab is-active">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button type="button" className="admin-tab">
            <Users size={18} />
            Residentes
          </button>
          <button type="button" className="admin-tab">
            <Receipt size={18} />
            Facturas
          </button>
          <button type="button" className="admin-tab">
            <CalendarDays size={18} />
            Reservas
          </button>
          <button type="button" className="admin-tab">
            <Bell size={18} />
            Anuncios
          </button>
        </nav>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading__spinner" />
            <p>Cargando datos...</p>
          </div>
        ) : !error ? (
          <>
            <section className="metrics-grid" aria-label="Indicadores">
              <MetricCard
                title="Unidades"
                value={data.dashboard?.total_units ?? 0}
                icon={<Building2 size={24} />}
                color="#176b5c"
              />
              <MetricCard
                title="Residentes"
                value={data.dashboard?.total_residents ?? 0}
                icon={<Users size={24} />}
                color="#1a73e8"
              />
              <MetricCard
                title="Facturado"
                value={money(data.dashboard?.monthly_billed ?? 0)}
                icon={<FileText size={24} />}
                color="#34a853"
              />
              <MetricCard
                title="Recaudado"
                value={money(data.dashboard?.collected ?? 0)}
                icon={<BadgeCheck size={24} />}
                trend={
                  data.dashboard?.monthly_collection_rate
                    ? `${data.dashboard.monthly_collection_rate.toFixed(1)}%`
                    : "0%"
                }
                color="#0a9396"
              />
              <MetricCard
                title="Morosos"
                value={money(data.dashboard?.overdue ?? 0)}
                icon={<Bell size={24} />}
                trend={`${data.dashboard?.delinquent_units ?? 0} unidades`}
                color="#d32f2f"
              />
              <MetricCard
                title="Reservas"
                value={data.dashboard?.active_reservations ?? 0}
                icon={<CalendarDays size={24} />}
                color="#f57c00"
              />
            </section>

            <section className="panels-grid" aria-label="Resúmenes">
              <div className="panel">
                <h3>Residentes recientes</h3>
                <div className="panel-list">
                  {data.residents.slice(0, 5).map((r) => (
                    <div key={r.id} className="panel-row">
                      <div className="panel-row__title">{r.full_name}</div>
                      <div className="panel-row__meta">
                        {r.email} • {r.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h3>Facturas recientes</h3>
                <div className="panel-list">
                  {data.invoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="panel-row">
                      <div className="panel-row__line">
                        <span className="panel-row__title">{inv.invoice_number}</span>
                        <span className="panel-row__amount">{money(inv.total)}</span>
                      </div>
                      <div className="panel-row__meta">
                        Periodo: {inv.period} • Status: {inv.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
