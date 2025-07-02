import { Suspense } from "react";
import { Outlet } from "react-router-dom";

function Root() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
  );
}

export default Root; 