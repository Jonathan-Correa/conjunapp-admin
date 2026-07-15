import { FormEvent, useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import {
  api,
  money,
  type CommonArea,
  type CommonAreaDetail,
  type CommonAreaPayload,
  type ScheduleItem,
} from "../lib/api";

const emptyForm: CommonAreaPayload = {
  name: "",
  category: "general",
  description: "",
  capacity: 20,
  hourly_rate: 0,
  has_cost: false,
  requires_approval: false,
  rules: "",
  is_active: true,
  is_bookable: true,
  min_duration_minutes: 60,
  max_duration_minutes: 240,
  min_advance_minutes: 0,
  max_advance_days: 90,
  cleanup_buffer_minutes: 0,
  max_active_per_resident: 3,
  required_documents: [],
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function defaultSchedules(): ScheduleItem[] {
  return WEEKDAYS.map((_, weekday) => ({
    weekday,
    open_time: "08:00",
    close_time: "20:00",
    is_closed: weekday === 6,
  }));
}

export function CommonAreasPage() {
  const [rows, setRows] = useState<CommonArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CommonAreaPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CommonAreaDetail | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(defaultSchedules());
  const [imageUrls, setImageUrls] = useState("");
  const [blackout, setBlackout] = useState({
    reason_type: "maintenance",
    starts_at: "",
    ends_at: "",
    note: "",
  });
  const [docsText, setDocsText] = useState("");
  const [special, setSpecial] = useState({
    on_date: "",
    open_time: "08:00",
    close_time: "18:00",
    is_closed: false,
    note: "",
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.commonAreas());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar zonas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function openDetail(id: string) {
    setBusy(true);
    setError("");
    try {
      const detail = await api.commonAreaDetail(id);
      setSelected(detail);
      setSchedules(
        detail.schedules.length
          ? WEEKDAYS.map((_, weekday) => {
              const found = detail.schedules.find((s) => s.weekday === weekday);
              return found
                ? {
                    weekday,
                    open_time: found.open_time ?? "08:00",
                    close_time: found.close_time ?? "20:00",
                    is_closed: found.is_closed,
                  }
                : { weekday, open_time: "08:00", close_time: "20:00", is_closed: true };
            })
          : defaultSchedules(),
      );
      setImageUrls(detail.images.map((i) => i.url).join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el detalle");
    } finally {
      setBusy(false);
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDocsText("");
    setShowForm(true);
    setSelected(null);
  }

  function startEdit(area: CommonArea) {
    setEditingId(area.id);
    setForm({
      name: area.name,
      category: area.category,
      description: area.description,
      capacity: area.capacity,
      hourly_rate: Number(area.hourly_rate),
      has_cost: area.has_cost,
      requires_approval: area.requires_approval,
      rules: area.rules,
      is_active: area.is_active,
      is_bookable: area.is_bookable,
      min_duration_minutes: area.min_duration_minutes,
      max_duration_minutes: area.max_duration_minutes,
      min_advance_minutes: area.min_advance_minutes,
      max_advance_days: area.max_advance_days,
      cleanup_buffer_minutes: area.cleanup_buffer_minutes,
      max_active_per_resident: area.max_active_per_resident,
      required_documents: area.required_documents ?? [],
    });
    setDocsText((area.required_documents ?? []).join("\n"));
    setShowForm(true);
    void openDetail(area.id);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const docs = docsText
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean);
      const payload = {
        ...form,
        required_documents: docs,
        has_cost: form.has_cost || form.hourly_rate > 0,
      };
      if (editingId) {
        await api.updateCommonArea(editingId, payload);
        setMessage("Zona actualizada.");
      } else {
        await api.createCommonArea(payload);
        setMessage("Zona creada.");
        setShowForm(false);
      }
      await load();
      if (editingId) await openDetail(editingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate(id: string) {
    if (!confirm("¿Desactivar esta zona social?")) return;
    setBusy(true);
    try {
      await api.deactivateCommonArea(id);
      setMessage("Zona desactivada.");
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar");
    } finally {
      setBusy(false);
    }
  }

  async function saveSchedules() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const detail = await api.replaceSchedules(selected.id, schedules);
      setSelected(detail);
      setMessage("Horarios guardados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar horarios");
    } finally {
      setBusy(false);
    }
  }

  async function saveImages() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const items = imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
        .map((url, sort_order) => ({ url, sort_order }));
      const detail = await api.replaceImages(selected.id, items);
      setSelected(detail);
      setMessage("Imágenes actualizadas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar imágenes");
    } finally {
      setBusy(false);
    }
  }

  async function addBlackout(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api.createBlackout(selected.id, {
        reason_type: blackout.reason_type,
        starts_at: new Date(blackout.starts_at).toISOString(),
        ends_at: new Date(blackout.ends_at).toISOString(),
        note: blackout.note,
      });
      setBlackout({ reason_type: "maintenance", starts_at: "", ends_at: "", note: "" });
      setMessage("Bloqueo creado.");
      await openDetail(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el bloqueo");
    } finally {
      setBusy(false);
    }
  }

  async function removeBlackout(id: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.deleteBlackout(selected.id, id);
      setMessage("Bloqueo eliminado.");
      await openDetail(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  async function addSpecialHours(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api.createSpecialHours(selected.id, {
        on_date: special.on_date,
        open_time: special.is_closed ? null : special.open_time,
        close_time: special.is_closed ? null : special.close_time,
        is_closed: special.is_closed,
        note: special.note,
      });
      setSpecial({ on_date: "", open_time: "08:00", close_time: "18:00", is_closed: false, note: "" });
      setMessage("Horario especial guardado.");
      await openDetail(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el horario especial");
    } finally {
      setBusy(false);
    }
  }

  async function removeSpecial(id: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.deleteSpecialHours(selected.id, id);
      setMessage("Horario especial eliminado.");
      await openDetail(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-header">
        <div>
          <h2>Zonas Sociales</h2>
          <p>Administra amenidades, horarios, imágenes y bloqueos del conjunto.</p>
        </div>
        <button type="button" className="btn-primary" onClick={startCreate}>
          Nueva zona
        </button>
      </div>

      {message ? <div className="admin-notice">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      {showForm ? (
        <form className="admin-form panel" onSubmit={onSubmit}>
          <h3>{editingId ? "Editar zona" : "Alta de zona social"}</h3>
          <div className="form-grid">
            <label>
              Nombre
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Categoría
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            <label className="span-2">
              Descripción
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              Capacidad
              <input type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </label>
            <label>
              Tarifa / hora
              <input type="number" min={0} value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value), has_cost: Number(e.target.value) > 0 })} />
            </label>
            <label>
              Duración mín (min)
              <input type="number" min={15} value={form.min_duration_minutes} onChange={(e) => setForm({ ...form, min_duration_minutes: Number(e.target.value) })} />
            </label>
            <label>
              Duración máx (min)
              <input type="number" min={15} value={form.max_duration_minutes} onChange={(e) => setForm({ ...form, max_duration_minutes: Number(e.target.value) })} />
            </label>
            <label>
              Anticipación mín (min)
              <input type="number" min={0} value={form.min_advance_minutes} onChange={(e) => setForm({ ...form, min_advance_minutes: Number(e.target.value) })} />
            </label>
            <label>
              Anticipación máx (días)
              <input type="number" min={1} value={form.max_advance_days} onChange={(e) => setForm({ ...form, max_advance_days: Number(e.target.value) })} />
            </label>
            <label>
              Buffer limpieza (min)
              <input type="number" min={0} value={form.cleanup_buffer_minutes} onChange={(e) => setForm({ ...form, cleanup_buffer_minutes: Number(e.target.value) })} />
            </label>
            <label>
              Máx. reservas activas
              <input type="number" min={1} value={form.max_active_per_resident} onChange={(e) => setForm({ ...form, max_active_per_resident: Number(e.target.value) })} />
            </label>
            <label className="span-2">
              Reglamento
              <textarea rows={3} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            </label>
            <label className="span-2">
              Documentos requeridos (uno por línea)
              <textarea
                rows={3}
                value={docsText}
                onChange={(e) => setDocsText(e.target.value)}
                placeholder={"Cédula\nPaz y salvo"}
              />
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={form.is_bookable} onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })} />
              Reservable
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={form.requires_approval} onChange={(e) => setForm({ ...form, requires_approval: e.target.checked })} />
              Requiere aprobación
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Activa
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={form.has_cost} onChange={(e) => setForm({ ...form, has_cost: e.target.checked })} />
              Genera costo
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cerrar
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando zonas...</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Capacidad</th>
                <th>Tarifa</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                    <small>{a.is_bookable ? "Reservable" : "Solo informativa"}</small>
                  </td>
                  <td>{a.category}</td>
                  <td>{a.capacity}</td>
                  <td>{a.has_cost ? `${money(a.hourly_rate)}/h` : "Sin costo"}</td>
                  <td>
                    <span className={`pill ${a.is_active ? "ok" : "danger"}`}>{a.is_active ? "Activa" : "Inactiva"}</span>
                  </td>
                  <td>
                    <button type="button" className="btn-secondary" onClick={() => startEdit(a)}>
                      Editar
                    </button>{" "}
                    {a.is_active ? (
                      <button type="button" className="btn-secondary" onClick={() => void onDeactivate(a.id)}>
                        Desactivar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="panels-grid" style={{ marginTop: 20 }}>
          <div className="panel">
            <h3>Horarios — {selected.name}</h3>
            <div className="form-grid">
              {schedules.map((s, idx) => (
                <label key={s.weekday} className="span-2" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <strong style={{ width: 40 }}>{WEEKDAYS[s.weekday]}</strong>
                  <input
                    type="checkbox"
                    checked={!s.is_closed}
                    onChange={(e) => {
                      const next = [...schedules];
                      next[idx] = { ...s, is_closed: !e.target.checked };
                      setSchedules(next);
                    }}
                  />
                  <span>Abierto</span>
                  <input
                    type="time"
                    disabled={s.is_closed}
                    value={s.open_time ?? "08:00"}
                    onChange={(e) => {
                      const next = [...schedules];
                      next[idx] = { ...s, open_time: e.target.value };
                      setSchedules(next);
                    }}
                  />
                  <input
                    type="time"
                    disabled={s.is_closed}
                    value={s.close_time ?? "20:00"}
                    onChange={(e) => {
                      const next = [...schedules];
                      next[idx] = { ...s, close_time: e.target.value };
                      setSchedules(next);
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void saveSchedules()}>
                Guardar horarios
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Imágenes (URLs)</h3>
            <textarea rows={5} value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} placeholder={"https://...\nhttps://..."} />
            <div className="form-actions">
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void saveImages()}>
                Guardar imágenes
              </button>
            </div>

            <h3 style={{ marginTop: 24 }}>Bloqueos</h3>
            <form className="form-grid" onSubmit={addBlackout}>
              <label>
                Tipo
                <select value={blackout.reason_type} onChange={(e) => setBlackout({ ...blackout, reason_type: e.target.value })}>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="holiday">Festivo</option>
                  <option value="block">Bloqueo</option>
                </select>
              </label>
              <label>
                Inicio
                <input required type="datetime-local" value={blackout.starts_at} onChange={(e) => setBlackout({ ...blackout, starts_at: e.target.value })} />
              </label>
              <label>
                Fin
                <input required type="datetime-local" value={blackout.ends_at} onChange={(e) => setBlackout({ ...blackout, ends_at: e.target.value })} />
              </label>
              <label className="span-2">
                Nota
                <input value={blackout.note} onChange={(e) => setBlackout({ ...blackout, note: e.target.value })} />
              </label>
              <div className="form-actions span-2">
                <button type="submit" className="btn-secondary" disabled={busy}>
                  Agregar bloqueo
                </button>
              </div>
            </form>
            <div className="panel-list" style={{ marginTop: 12 }}>
              {selected.blackouts.length === 0 ? (
                <p className="empty">Sin bloqueos.</p>
              ) : (
                selected.blackouts.map((b) => (
                  <div key={b.id} className="panel-row">
                    <div className="panel-row__line">
                      <span className="panel-row__title">
                        {b.reason_type}: {new Date(b.starts_at).toLocaleString("es-CO")} → {new Date(b.ends_at).toLocaleString("es-CO")}
                      </span>
                      <button type="button" className="btn-secondary" onClick={() => void removeBlackout(b.id)}>
                        Quitar
                      </button>
                    </div>
                    {b.note ? <div className="panel-row__meta">{b.note}</div> : null}
                  </div>
                ))
              )}
            </div>

            <h3 style={{ marginTop: 24 }}>Horarios especiales</h3>
            <form className="form-grid" onSubmit={addSpecialHours}>
              <label>
                Fecha
                <input required type="date" value={special.on_date} onChange={(e) => setSpecial({ ...special, on_date: e.target.value })} />
              </label>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={special.is_closed}
                  onChange={(e) => setSpecial({ ...special, is_closed: e.target.checked })}
                />
                Cerrado ese día
              </label>
              <label>
                Apertura
                <input
                  type="time"
                  disabled={special.is_closed}
                  value={special.open_time}
                  onChange={(e) => setSpecial({ ...special, open_time: e.target.value })}
                />
              </label>
              <label>
                Cierre
                <input
                  type="time"
                  disabled={special.is_closed}
                  value={special.close_time}
                  onChange={(e) => setSpecial({ ...special, close_time: e.target.value })}
                />
              </label>
              <label className="span-2">
                Nota
                <input value={special.note} onChange={(e) => setSpecial({ ...special, note: e.target.value })} />
              </label>
              <div className="form-actions span-2">
                <button type="submit" className="btn-secondary" disabled={busy}>
                  Guardar horario especial
                </button>
              </div>
            </form>
            <div className="panel-list" style={{ marginTop: 12 }}>
              {(selected.special_hours ?? []).length === 0 ? (
                <p className="empty">Sin horarios especiales.</p>
              ) : (
                (selected.special_hours ?? []).map((h) => (
                  <div key={h.id} className="panel-row">
                    <div className="panel-row__line">
                      <span className="panel-row__title">
                        {h.on_date}: {h.is_closed ? "Cerrado" : `${h.open_time} – ${h.close_time}`}
                      </span>
                      <button type="button" className="btn-secondary" onClick={() => void removeSpecial(h.id)}>
                        Quitar
                      </button>
                    </div>
                    {h.note ? <div className="panel-row__meta">{h.note}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
