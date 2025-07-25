import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../hooks/auth/useAuth";

function Root() {
  useAuth(); // Move auth check here - similar to SmartEstate

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProtectedRoute />
      <Outlet />
    </Suspense>
  );
}

export default Root;
