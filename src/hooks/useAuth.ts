import { useEffect } from "react";
import { useAuthStore } from "../store/auth";

/**
 * Hook para obtener el estado actual de autenticación
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    token,
    isAuthenticated,
    logout,
  };
}

/**
 * Hook para proteger rutas que requieren autenticación
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // La redirección la manejaría el componente ProtectedRoute
      // Este hook simplemente proporciona el estado
    }
  }, [isAuthenticated]);

  return { isAuthenticated };
}
