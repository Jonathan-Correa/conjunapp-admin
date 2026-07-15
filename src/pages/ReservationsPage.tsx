import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { api, money, type CommonArea, type ReservationAdmin } from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitada",
  approved: "Aprobada",
  paid: "Pagada",
  waitlisted: "En lista",
  cancelled: "Cancelada",
  rescheduled: "Reprogramada",
  rejected: "Rechazada",
  completed: "Completada",
};

function statusClass(status: string): string {
  if (status === "approved" || status === "paid" || status === "completed") return "ok";
  if (status === "rejected" || status === "cancelled") return "danger";
  return "warn";
}

export function ReservationsPage() {
  const [rows, setRows] = useState<ReservationAdmin[]>([]);
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
    common_area_id: "",
    status: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [reservations, commonAreas] = await Promise.all([
        api.reservations({
          from_date: filters.from_date || undefined,
          to_date: filters.to_date || undefined,
          common_area_id: filters.common_area_id || undefined,
          status: filters.status || undefined,
        }),
        api.commonAreas(),
      ]);
      setAreas(commonAreas);
      setRows(reservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "requested").length, [rows]);

  async function approve(id: string) {
    setBusy(true);
    setError("");
    try {
      await api.approveReservation(id);
      setMessage("Reserva aprobada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aprobar");
    } finally {
      setBusy(false);
    }
  }

  async function reject(id: string) {
    const reason = prompt("Motivo del rechazo (opcional):") ?? "";
    setBusy(true);
    setError("");
    try {
      await api.rejectReservation(id, reason);
      setMessage("Reserva rechazada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo rechazar");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    setBusy(true);
    setError("");
    try {
      await api.cancelReservationAdmin(id);
      setMessage("Reserva cancelada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setBusy(true);
    setError("");
    try {
      const blob = await api.exportReservationsCsv({
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined,
        common_area_id: filters.common_area_id || undefined,
        status: filters.status || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reservas.csv";
      a.click();
      URL.revokeObjectURL(url);
      setMessage("CSV exportado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo exportar");
    } finally {
      setBusy(false);
    }
  }

  async function runMaintenance() {
    setBusy(true);
    setError("");
    try {
      const result = await api.runReservationsMaintenance();
      setMessage(`Mantenimiento: ${result.completed} completadas, ${result.expired} vencidas.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ejecutar el job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-header">
        <div>
          <h2>Reservas</h2>
          <p>
            Gestión de reservas de zonas sociales · {pendingCount} pendientes de aprobación
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void exportCsv()}>
            Exportar CSV
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void runMaintenance()}>
            Finalizar vencidas
          </button>
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            Actualizar
          </button>
        </div>
      </div>

      {message ? <div className="admin-notice">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <form
        className="admin-form panel"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <h3>Filtros</h3>
        <div className="form-grid">
          <label>
            Desde
            <input type="date" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} />
          </label>
          <label>
            Hasta
            <input type="date" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} />
          </label>
          <label>
            Zona
            <select value={filters.common_area_id} onChange={(e) => setFilters({ ...filters, common_area_id: e.target.value })}>
              <option value="">Todas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Aplicar filtros
          </button>
        </div>
      </form>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando reservas...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <p className="empty">No hay reservas con esos filtros.</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Zona</th>
                <th>Residente</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Monto</th>
                <th>Comprobante</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.common_area_name}</td>
                  <td>{r.resident_name}</td>
                  <td>{new Date(r.starts_at).toLocaleString("es-CO")}</td>
                  <td>{new Date(r.ends_at).toLocaleString("es-CO")}</td>
                  <td>{money(r.amount)}</td>
                  <td>{r.receipt_number || "—"}</td>
                  <td>
                    <span className={`pill ${statusClass(r.status)}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                    {r.reject_reason ? <small>{r.reject_reason}</small> : null}
                  </td>
                  <td>
                    {r.status === "requested" ? (
                      <>
                        <button type="button" className="btn-primary" disabled={busy} onClick={() => void approve(r.id)}>
                          Aprobar
                        </button>{" "}
                        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void reject(r.id)}>
                          Rechazar
                        </button>
                      </>
                    ) : null}{" "}
                    {r.status !== "cancelled" && r.status !== "rejected" && r.status !== "completed" ? (
                      <button type="button" className="btn-secondary" disabled={busy} onClick={() => void cancel(r.id)}>
                        Cancelar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
