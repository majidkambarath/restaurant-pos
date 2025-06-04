import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminEncrypted from "../components/auth/SecretEncryptionTool";
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminEncrypted />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
