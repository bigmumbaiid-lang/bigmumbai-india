// import { Navigate, Outlet } from "react-router-dom";

// const ProtectedRoute = () => {
//   const token = localStorage.getItem("token");

//   return token ? <Outlet /> : <Navigate to="/login" />;
// };

// export default ProtectedRoute;

import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = () => {

  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // or spinner

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;