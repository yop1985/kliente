import { Navigate, Route, Routes } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import PublicHomePage from "./pages/public/PublicHomePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminSecuritySetupPage from "./pages/admin/AdminSecuritySetupPage";
import AdminAccountSecurityPage from "./pages/admin/AdminAccountSecurityPage";

import MasterLoginPage from "./pages/master/MasterLoginPage";
import MasterDashboardPage from "./pages/master/MasterDashboardPage";

import DemoLocalAdmin from "./demo/DemoLocalAdmin";
import DemoPublicScreen from "./demo/DemoPublicScreen";

import { getAdminNextStep, isAdminLoggedIn } from "./services/adminApi";
import { isMasterLoggedIn } from "./services/masterApi";

const IS_NATIVE_APP = Capacitor.isNativePlatform();
const IS_APK_DEMO = import.meta.env.VITE_APK_DEMO === "true";
const SHOULD_FORCE_DEMO = IS_NATIVE_APP || IS_APK_DEMO;

function AdminRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AdminDashboardRoute() {
  const nextStep = getAdminNextStep();

  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (nextStep === "change_password" || nextStep === "create_pin") {
    return <Navigate to="/admin/security-setup" replace />;
  }

  return <AdminDashboardPage />;
}

function AdminSecurityRoute() {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminSecuritySetupPage />;
}

function AdminAccountSecurityRoute() {
  const nextStep = getAdminNextStep();

  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (nextStep === "change_password" || nextStep === "create_pin") {
    return <Navigate to="/admin/security-setup" replace />;
  }

  return <AdminAccountSecurityPage />;
}

function MasterRoute({ children }) {
  if (!isMasterLoggedIn()) {
    return <Navigate to="/mitnick/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          SHOULD_FORCE_DEMO ? (
            <Navigate to="/demo-admin" replace />
          ) : (
            <PublicHomePage />
          )
        }
      />

      <Route path="/demo-admin" element={<DemoLocalAdmin />} />
      <Route path="/demo-public" element={<DemoPublicScreen />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/admin/security-setup"
        element={
          <AdminRoute>
            <AdminSecurityRoute />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/account-security"
        element={
          <AdminRoute>
            <AdminAccountSecurityRoute />
          </AdminRoute>
        }
      />

      <Route path="/admin/dashboard" element={<AdminDashboardRoute />} />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/mitnick/login" element={<MasterLoginPage />} />

      <Route
        path="/mitnick/dashboard"
        element={
          <MasterRoute>
            <MasterDashboardPage />
          </MasterRoute>
        }
      />

      <Route path="/mitnick" element={<Navigate to="/mitnick/dashboard" replace />} />

      <Route
        path="*"
        element={
          SHOULD_FORCE_DEMO ? (
            <Navigate to="/demo-admin" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}
