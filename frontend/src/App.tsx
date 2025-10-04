// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./common/Navigation";
import Login from "./components/login/Login";
import Profile from "./components/profile/Profile";
import { useAll } from "./context/AllContext";
import { useEffect, type ReactNode } from "react";
import { useLoader } from "./common/Loader";
import Signup from "./components/signup/Signup";
import { Toaster } from "react-hot-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { auth } = useAll();
  const loader = useLoader();

  // Update global loader safely
  useEffect(() => {
    loader(auth.isLoading);
  }, [auth.isLoading, loader]);

  if (auth.isLoading) return null; // loader handles the UI

  if (!auth.user) return <Navigate to="/login" replace />;

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(auth.user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { auth, accessibleComponents } = useAll();
  const loader = useLoader();

  useEffect(() => {
    loader(auth.isLoading);
  }, [auth.isLoading, loader]);

  return (
    <BrowserRouter>
      {/* Navigation only when logged in */}
      {auth.user && <Navigation />}
      <Toaster
        position="top-right" 
        reverseOrder={false} 
      />
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={
            auth.isLoading
              ? null
              : auth.user
              ? <Navigate to="/" replace />
              : <Login />
          }
        />

        {
          !auth.user && <Route 
          path="/signup"
          element={
            auth.isLoading ? null : auth.user ? <Navigate to='/' replace />
            : <Signup/>
          }
          />
        }

        {/* Root route: always render Profile */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Other dynamic routes */}
        {accessibleComponents
          .filter((comp) => comp.route !== "/") // skip root
          .map((comp) => (
            <Route
              key={comp.route}
              path={comp.route}
              element={
                <ProtectedRoute requiredRoles={comp.permissions}>
                  {comp.element}
                </ProtectedRoute>
              }
            />
          ))}

        {/* Catch-all: redirect unknown routes to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
