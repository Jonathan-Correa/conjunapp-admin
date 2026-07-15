import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { api, money, type CommonArea, type Reservation } from "../lib/api";

export function ReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [areas, setAreas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [reservations, commonAreas] = await Promise.all([api.reservations(), api.commonAreas()]);
      const map: Record<string, string> = {};
      commonAreas.forEach((a: CommonArea) => {
        map[a.id] = a.name;
      });
      setAreas(map);
      setRows(reservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminLayout>
      <div className="section-header">
        <div>
          <h2>Reservas</h2>
          <p>Reservas de zonas comunes del conjunto.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void load()}>
          Actualizar
        </button>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando reservas...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <p className="empty">No hay reservas registradas.</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Zona</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{areas[r.common_area_id] ?? r.common_area_id}</td>
                  <td>{new Date(r.starts_at).toLocaleString("es-CO")}</td>
                  <td>{new Date(r.ends_at).toLocaleString("es-CO")}</td>
                  <td>{money(r.amount)}</td>
                  <td>
                    <span className="pill warn">{r.status}</span>
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
