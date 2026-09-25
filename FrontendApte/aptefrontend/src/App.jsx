import AppRoutes from "./routes/AppRoutes";

/**
 * Racine de l'application. Le routeur et les fournisseurs de contexte sont
 * montés dans main.jsx : les dupliquer ici créait un second état
 * d'authentification, distinct de celui que lisaient les composants.
 */
export default function App() {
  return <AppRoutes />;
}
