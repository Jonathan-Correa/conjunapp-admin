import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, Building2, CalendarDays, FileText, LayoutDashboard, LogOut, Receipt, Users } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { useAuthStore } from "../store/auth";
import { api, money, type AccountingReport, type Announcement, type CommonArea, type Dashboard, type Invoice, type Reservation, type Resident, type Unit } from "../lib/api";
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
      const [dashboard, residents, units, invoices, areas, reservations, announcements, accounting] = await Promise.all([
        api.dashboard(),
        api.residents(),
        api.units(),
        api.invoices(),
        api.commonAreas(),
        api.reservations(),
        api.announcements(),
        api.accountingReport(),
      ]);
      setData({ dashboard, residents, units, invoices, areas, reservations, announcements, accounting });
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f2" }}>
      <header style={{ backgroundColor: "#176b5c", color: "white", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Building2 size={28} />
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>ConjunApp Admin</h1>
              <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.9 }}>Portal de Administración</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>{user?.full_name}</p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>{user?.position}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px", maxWidth: "1400px", width: "100%", margin: "0 auto" }}>
        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "#fdecea",
              borderRadius: "8px",
              color: "#611a15",
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <span>{error}</span>
            <button type="button" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid #ddd", paddingBottom: "12px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderBottom: "3px solid #176b5c", backgroundColor: "transparent", border: "none", color: "#176b5c", fontWeight: "600", cursor: "pointer" }}>
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", border: "none", color: "#666", fontWeight: "600", cursor: "pointer" }}>
            <Users size={18} />
            Residentes
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", border: "none", color: "#666", fontWeight: "600", cursor: "pointer" }}>
            <Receipt size={18} />
            Facturas
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", border: "none", color: "#666", fontWeight: "600", cursor: "pointer" }}>
            <CalendarDays size={18} />
            Reservas
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", border: "none", color: "#666", fontWeight: "600", cursor: "pointer" }}>
            <Bell size={18} />
            Anuncios
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #ddd", borderTopColor: "#176b5c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ marginTop: "16px" }}>Cargando datos...</p>
          </div>
        ) : !error ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
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
                trend={data.dashboard?.monthly_collection_rate ? `${data.dashboard.monthly_collection_rate.toFixed(1)}%` : "0%"}
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "20px" }}>
              <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "#333" }}>Residentes Recientes</h3>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {data.residents.slice(0, 5).map((r) => (
                    <div key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "14px" }}>
                      <div style={{ fontWeight: "500", color: "#333" }}>{r.full_name}</div>
                      <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                        {r.email} • {r.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "#333" }}>Facturas Recientes</h3>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {data.invoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: "500", color: "#333" }}>{inv.invoice_number}</span>
                        <span style={{ fontWeight: "600", color: "#176b5c" }}>{money(inv.total)}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                        Periodo: {inv.period} • Status: {inv.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
