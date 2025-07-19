import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useAppInit } from "../hooks/auth/useAppInit";

function Root() {
  useAppInit(); // Initialize app and load user if session exists
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
  );
}

export default Root;
