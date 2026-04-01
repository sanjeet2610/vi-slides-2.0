import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import NotFound from "./pages/NotFound";
import type { Role, StoredUser } from "./types";

function parseStoredUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") as StoredUser | null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ allowedRole, children }: { allowedRole: Role; children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = parseStoredUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const user = parseStoredUser();

  if (token && user?.role === "student") return <Navigate to="/student" replace />;
  if (token && user?.role === "teacher") return <Navigate to="/teacher" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
