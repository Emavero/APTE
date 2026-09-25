import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import ApartementsPage from "../pages/ApartementsPage";
import Home from "../pages/Home";
import HousesPage from "../pages/HousesPage";
import IntrusionProtectionPage from "../pages/IntrusionProtectionPage";
import Login from "../pages/Login";
import OfficesPage from "../pages/OfficesPage";
import OrdersPage from "../pages/OrdersPage";
import ProductsPage from "../pages/ProductsPage";
import QuoteRequestPage from "../pages/QuoteRequestPages";
import Register from "../pages/Register";
import ResetPassword from "../pages/ResetPassword";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/appartements" element={<ApartementsPage />} />
      <Route path="/houses" element={<HousesPage />} />
      <Route path="/offices" element={<OfficesPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/intrusion" element={<IntrusionProtectionPage />} />
      <Route path="/quote" element={<QuoteRequestPage />} />

      {/* Routes protégées */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      {/* L'espace d'administration exige un compte du personnel. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute staffOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Toute autre adresse retombe sur l'accueil. */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
