import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Garde de route. `staffOnly` protège l'espace d'administration : sans lui,
 * n'importe quel compte connecté pouvait ouvrir le tableau de bord admin.
 */
export default function ProtectedRoute({ children, staffOnly = false }) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-10">Chargement...</div>;
  }

  if (!user) {
    // `state` permet de revenir à la page demandée après connexion.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
}
