import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useAppInit } from "../hooks/auth/useAppInit";

function Root() {
  useAppInit();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
  );
}

export default Root;
