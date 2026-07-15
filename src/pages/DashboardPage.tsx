import { useEffect, useState } from "react";
import { BadgeCheck, Bell, Building2, CalendarDays, FileText, Users } from "lucide-react";
import { AdminLayout } from "../components/AdminLayout";
import { MetricCard } from "../components/MetricCard";
import { api, money, type Dashboard, type Invoice, type Resident } from "../lib/api";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "No se pudieron cargar los datos del dashboard.";
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dash, residentRows, invoiceRows] = await Promise.all([
        api.dashboard(),
        api.residents(),
        api.invoices(),
      ]);
      setDashboard(dash);
      setResidents(residentRows);
      setInvoices(invoiceRows);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminLayout>
      {error ? (
        <div className="admin-alert">
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando datos...</p>
        </div>
      ) : !error ? (
        <>
          <section className="metrics-grid" aria-label="Indicadores">
            <MetricCard title="Unidades" value={dashboard?.total_units ?? 0} icon={<Building2 size={24} />} color="#176b5c" />
            <MetricCard title="Residentes" value={dashboard?.total_residents ?? 0} icon={<Users size={24} />} color="#1a73e8" />
            <MetricCard title="Facturado" value={money(dashboard?.monthly_billed ?? 0)} icon={<FileText size={24} />} color="#34a853" />
            <MetricCard
              title="Recaudado"
              value={money(dashboard?.collected ?? 0)}
              icon={<BadgeCheck size={24} />}
              trend={dashboard?.monthly_collection_rate ? `${dashboard.monthly_collection_rate.toFixed(1)}%` : "0%"}
              color="#0a9396"
            />
            <MetricCard
              title="Morosos"
              value={money(dashboard?.overdue ?? 0)}
              icon={<Bell size={24} />}
              trend={`${dashboard?.delinquent_units ?? 0} unidades`}
              color="#d32f2f"
            />
            <MetricCard
              title="Reservas"
              value={dashboard?.active_reservations ?? 0}
              icon={<CalendarDays size={24} />}
              color="#f57c00"
            />
          </section>

          <section className="panels-grid" aria-label="Resúmenes">
            <div className="panel">
              <h3>Residentes recientes</h3>
              <div className="panel-list">
                {residents.slice(0, 5).map((r) => (
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
                {invoices.slice(0, 5).map((inv) => (
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
    </AdminLayout>
  );
}
