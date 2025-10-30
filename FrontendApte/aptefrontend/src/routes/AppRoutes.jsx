import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import ProductsPage from "../pages/ProductsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AdminDashboard from "../pages/AdminDashboard";
import ApartementsPage from "../pages/ApartementsPage";
import HousesPage from "../pages/HousesPage";
import OfficesPage from "../pages/OfficesPage";
import ResetPassword from "../pages/ResetPassword";
import IntrusionProtectionPage from "../pages/IntrusionProtectionPage";
import QuoteRequestPage from "../pages/QuoteRequestPages";



import Order from "../pages/Order";


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
      <Route path="/quote" element={<QuoteRequestPage/>} />


      {/* Routes protégées */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Order/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
