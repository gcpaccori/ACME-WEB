import { Navigate, Route, Routes } from 'react-router-dom';
import { AppRoutes } from '../../core/constants/routes';
import { PublicLayout, PortalLayout } from '../layouts';
import { LoginPage } from '../../modules/auth/login/LoginPage';
import { HomePage } from '../../modules/public/home/HomePage';
import { AboutPage } from '../../modules/public/about/AboutPage';
import { BusinessPage } from '../../modules/public/business/BusinessPage';
import { ContactPage } from '../../modules/public/contact/ContactPage';
import { DownloadsPage } from '../../modules/public/downloads/DownloadsPage';
import { PrivateRoute } from '../../modules/auth/guards/PrivateRoute';
import { DashboardPage } from '../../modules/portal/dashboard/DashboardPage';
import { OrdersPage, OrderDetailPage } from '../../modules/portal/orders';
import { MenuPage } from '../../modules/portal/menu/MenuPage';
import { CategoriesPage } from '../../modules/portal/categories/CategoriesPage';
import { ProductsPage } from '../../modules/portal/products/ProductsPage';
import { BranchStatusPage } from '../../modules/portal/branch-status/BranchStatusPage';
import { HoursPage } from '../../modules/portal/hours/HoursPage';
import { StaffPage } from '../../modules/portal/staff/StaffPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="como-funciona" element={<AboutPage />} />
        <Route path="para-negocios" element={<BusinessPage />} />
        <Route path="descargar" element={<DownloadsPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="portal/login" element={<LoginPage />} />

        <Route
          path="portal"
          element={
            <PrivateRoute>
              <PortalLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="branch-status" element={<BranchStatusPage />} />
          <Route path="hours" element={<HoursPage />} />
          <Route path="staff" element={<StaffPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
