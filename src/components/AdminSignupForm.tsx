import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import "./SignupForm.css";

export function AdminSignupForm() {
  const navigate = useNavigate();
  const { setAuth, setError, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    position: "Administrador",
    password: "",
    password_confirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");
    setIsLoading(true);

    try {
      // Validations
      if (!formData.email || !formData.full_name || !formData.password) {
        throw new Error("Por favor completa todos los campos");
      }

      if (formData.password !== formData.password_confirm) {
        throw new Error("Las contraseñas no coinciden");
      }

      if (formData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      const response = await api.auth.adminRegister({
        email: formData.email,
        full_name: formData.full_name,
        position: formData.position,
        password: formData.password,
        password_confirm: formData.password_confirm,
      });

      setAuth(response.user, response.access_token);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse";
      setLocalError(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <Link to="/" className="back-button">
          <ArrowLeft size={20} />
          Volver
        </Link>

        <div className="signup-header">
          <h1>Crear Cuenta Admin</h1>
          <p>Registra un nuevo administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name">Nombre completo</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nombre del administrador"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">Posición</label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="Administrador">Administrador</option>
              <option value="Administrador Principal">Administrador Principal</option>
              <option value="Tesorero">Tesorero</option>
              <option value="Secretario">Secretario</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
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

          <div className="form-group">
            <label htmlFor="password_confirm">Confirmar contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="password_confirm"
                type={showConfirmPassword ? "text" : "password"}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                Registrando...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Crear Cuenta
              </>
            )}
          </button>
        </form>

        <div className="signup-footer">
          <p>¿Ya tienes cuenta? <Link to="/">Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
}
