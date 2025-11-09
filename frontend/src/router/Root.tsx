import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

function Root() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProtectedRoute />
      <Outlet />
    </Suspense>
  );
}

export default Root;
