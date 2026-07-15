import { FormEvent, useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { api, type Announcement } from "../lib/api";

export function AnnouncementsPage() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.announcements());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar anuncios");
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
      await api.createAnnouncement({ title, body, category });
      setTitle("");
      setBody("");
      setCategory("general");
      setMessage("Anuncio publicado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el anuncio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-header">
        <div>
          <h2>Anuncios</h2>
          <p>Comunicados visibles para los residentes.</p>
        </div>
      </div>

      {message ? <div className="admin-notice">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <form className="admin-form panel" onSubmit={onCreate}>
        <h3>Nuevo anuncio</h3>
        <div className="form-grid">
          <label className="span-2">
            Título
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Categoría
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="security">Seguridad</option>
              <option value="finance">Finanzas</option>
            </select>
          </label>
          <label className="span-2">
            Contenido
            <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading__spinner" />
          <p>Cargando anuncios...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <p className="empty">No hay anuncios publicados.</p>
        </div>
      ) : (
        <div className="panels-grid">
          {rows.map((a) => (
            <article key={a.id} className="panel">
              <span className="pill">{a.category}</span>
              <h3 style={{ marginTop: 10 }}>{a.title}</h3>
              <p style={{ color: "#44515a", marginTop: 8 }}>{a.body}</p>
              <small style={{ display: "block", marginTop: 12, color: "#65736f" }}>
                {new Date(a.published_at).toLocaleString("es-CO")}
              </small>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
