import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import MemberDashboard from "./pages/MemberDashboard";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="screen-center">Loading dashboard...</div>;
  }

  return user ? children : <Navigate to="/auth" replace />;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === "librarian" ? <LibrarianDashboard /> : <MemberDashboard />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
    </Routes>
  );
}
