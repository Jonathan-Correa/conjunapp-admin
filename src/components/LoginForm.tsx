import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import "./LoginForm.css";

export function LoginForm() {
  const { setAuth, setError, setLoading, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("admin@conjunapp.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      const response = await api.auth.login(email, password);
      setAuth(response.user, response.access_token);
      // Navigation will be handled by the app routing
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ConjunApp Admin</h1>
          <p>Portal de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-credentials">Credenciales de demostración arriba</p>
          <p className="signup-link">¿No tienes cuenta? <Link to="/signup">Regístrate aquí</Link></p>
        </div>
      </div>
    </div>
  );
}
