import { FormEvent, useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { api, type CreateResidentPayload, type Resident } from "../lib/api";

const emptyForm: CreateResidentPayload = {
  full_name: "",
  email: "",
  phone: "",
  document_number: "",
  resident_type: "owner",
  is_owner: true,
  tower_name: "A",
  unit_number: "",
  administration_fee: 420000,
  parking_slot: "",
  initial_password: "",
};

export function ResidentsPage() {
  const [rows, setRows] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateResidentPayload>(emptyForm);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.residents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar residentes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const payload: CreateResidentPayload = {
        ...form,
        parking_slot: form.parking_slot?.trim() ? form.parking_slot : null,
        is_owner: form.resident_type === "owner",
      };
      await api.createResident(payload);
      setMessage("Residente creado correctamente.");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el residente");
    } finally {
      setBusy(false);
    }
  }

  async function issueClearance(resident: Resident) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await api.issuePeaceClearance(resident.unit_id);
      setMessage(
        `Paz y salvo emitido para ${resident.unit}: ${result.certificate_number} (válido hasta ${result.valid_until}).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo emitir paz y salvo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-header">
        <div>
          <h2>Residentes</h2>
          <p>Gestión de residentes y paz y salvo por unidad.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cerrar formulario" : "Nuevo residente"}
        </button>
      </div>

      {message ? <div className="admin-notice">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      {showForm ? (
        <form className="admin-form panel" onSubmit={onCreate}>
          <h3>Alta de residente</h3>
          <div className="form-grid">
            <label>
              Nombre completo
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Teléfono
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Documento
              <input
                required
                value={form.document_number}
                onChange={(e) => setForm({ ...form, document_number: e.target.value })}
              />
            </label>
            <label>
              Tipo
              <select
                value={form.resident_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    resident_type: e.target.value,
                    is_owner: e.target.value === "owner",
                  })
                }
              >
                <option value="owner">Propietario</option>
                <option value="tenant">Arrendatario</option>
              </select>
            </label>
            <label>
              Torre
              <input
                required
                value={form.tower_name}
                onChange={(e) => setForm({ ...form, tower_name: e.target.value })}
              />
            </label>
            <label>
              Unidad
              <input
                required
                value={form.unit_number}
                onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
              />
            </label>
            <label>
              Cuota administración
              <input
                required
                type="number"
                min={1}
                value={form.administration_fee}
                onChange={(e) => setForm({ ...form, administration_fee: Number(e.target.value) })}
              />
            </label>
            <label>
              Parqueadero
              <input
                value={form.parking_slot ?? ""}
                onChange={(e) => setForm({ ...form, parking_slot: e.target.value })}
              />
            </label>
            <label>
              Contraseña inicial
              <input
                required
                minLength={8}
                type="password"
                value={form.initial_password}
                onChange={(e) => setForm({ ...form, initial_password: e.target.value })}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Guardando..." : "Crear residente"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando residentes...</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Unidad</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.full_name}</strong>
                    <small>{r.document_number}</small>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.unit}</td>
                  <td>{r.resident_type}</td>
                  <td>
                    <span className={`pill ${r.is_delinquent ? "danger" : "ok"}`}>
                      {r.is_delinquent ? "Moroso" : "Al día"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy || r.is_delinquent}
                      title={r.is_delinquent ? "No aplica con saldo pendiente" : "Emitir paz y salvo"}
                      onClick={() => void issueClearance(r)}
                    >
                      Paz y salvo
                    </button>
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
