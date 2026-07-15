import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { api, money, type Invoice } from "../lib/api";

export function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const today = new Date();
  const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [issueDate, setIssueDate] = useState(today.toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 15).toISOString().slice(0, 10),
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.invoices({ onlyOpen }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [onlyOpen]);

  const openCount = useMemo(
    () => rows.filter((r) => r.status !== "paid" && r.status !== "cancelled").length,
    [rows],
  );

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const created = await api.generateInvoices(period, issueDate, dueDate);
      setMessage(
        created.length
          ? `Se generaron ${created.length} factura(s) para ${period}.`
          : `No se generaron facturas nuevas para ${period} (quizá ya existían).`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron generar facturas");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-header">
        <div>
          <h2>Facturas</h2>
          <p>
            {rows.length} en listado · {openCount} abiertas/pendientes
          </p>
        </div>
        <label className="inline-check">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          Solo abiertas
        </label>
      </div>

      {message ? <div className="admin-notice">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <form className="admin-form panel" onSubmit={onGenerate}>
        <h3>Generar facturas del periodo</h3>
        <div className="form-grid">
          <label>
            Periodo (YYYY-MM)
            <input required value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-07" />
          </label>
          <label>
            Fecha emisión
            <input required type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </label>
          <label>
            Fecha vencimiento
            <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Generando..." : "Generar facturas"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando facturas...</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Periodo</th>
                <th>Emisión</th>
                <th>Vence</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.period}</td>
                  <td>{inv.issue_date}</td>
                  <td>{inv.due_date}</td>
                  <td>{money(inv.total)}</td>
                  <td>{money(inv.paid_amount)}</td>
                  <td>
                    <span className={`pill ${inv.status === "paid" ? "ok" : inv.status === "overdue" ? "danger" : "warn"}`}>
                      {inv.status}
                    </span>
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
