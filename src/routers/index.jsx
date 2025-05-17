import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterSystem from "../components/auth/LoginRegisterSystem";
import POSSystem from "../components/pos/index";
import AdminEncrypted from "../components/auth/SecretEncryptionTool";
// Auth guard to check if user is logged in
const ProtectedRoute = ({ children }) => {
 const terminalName = localStorage.getItem("terminalName");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!terminalName || !isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginRegisterSystem />} />
      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <POSSystem />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<AdminEncrypted />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
