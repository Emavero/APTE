import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import ProductsPage from "../pages/ProductsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AdminDashboard from "../pages/AdminDashboard";
import ResetPassword from "../pages/ResetPassword";
import ApartementsPage from "../pages/ApartementsPage";
import HousesPage from "../pages/HousesPage";
import OfficesPage from "../pages/OfficesPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes protégées 
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
   */}
      {/* Routes publiques */}
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/apartments" element={<ApartementsPage />} />
      <Route path="/houses" element={<HousesPage />} />
      <Route path="/offices" element={<OfficesPage />} />
    </Routes>
  );
}
