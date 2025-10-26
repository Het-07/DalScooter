import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Amplify } from "aws-amplify";
// import aws_exports from './aws-exports';

// Import your existing AuthHandler and Dashboard
import AuthHandler from "./components/auth/AuthHandler";
import Dashboard from "./components/dashboard/Dashboard";

// --- Page Components ---
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import BikeManagementPage from "./pages/BikeManagementPage";
import AddBikePage from "./pages/AddBikePage";
import EditBikePage from "./pages/EditBikePage";
import AllBookingsPage from "./pages/AllBookingsPage";
import AdminConcernsPage from "./pages/AdminConcersPage";
import ChatBot from "./components/chatbot/Chatbot";
// Global Navigation
import Navbar from "./components/layout/Navbar";

// IMPORTANT: Keep this import if src/styles/App.css contains custom styles you want to apply.
// If App.css is empty or only contained @tailwind directives, you can safely remove this line.
import "./styles/App.css";

// Configure Amplify (only once per application lifecycle)
// Amplify.configure(aws_exports);

// Component to protect routes based on authentication and role
const ProtectedRoute = ({
  children,
  adminOnly = false,
  customerOnly = false,
}) => {
  const { isAuthenticated, isAdmin, isCustomer, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-700">
        Loading authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (customerOnly && !isCustomer) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const hiddenChatbotRoutes = [
    "/login",
    "/register",
    "/verify",
    "/question",
    "/caesar",
  ];
  const shouldShowChatBot = !hiddenChatbotRoutes.includes(location.pathname);

  return (
    <AuthProvider>
      <AppContent shouldShowChatBot={shouldShowChatBot} />
    </AuthProvider>
  );
}

// Separate component to use useLocation inside the Router context
function AppContent({ shouldShowChatBot }) {
  const location = useLocation();

  // Auth pages that should not show navbar
  const authRoutes = ["/login", "/register", "/verify", "/question", "/caesar"];
  const showNavbar = !authRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col font-inter relative">
      {showNavbar && <Navbar />}
      <main
        className={
          showNavbar ? "flex-grow w-full min-w-0" : "w-full min-h-screen"
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />

          {/* Auth Routes - AuthPage will render AuthHandler internally */}
          <Route path="/login" element={<AuthPage initialView="login" />} />
          <Route path="/register" element={<AuthPage initialView="signup" />} />
          <Route path="/verify" element={<AuthPage initialView="verify" />} />
          <Route
            path="/question"
            element={<AuthPage initialView="question" />}
          />
          <Route path="/caesar" element={<AuthPage initialView="caesar" />} />

          {/* Dashboard Route - This is where authenticated users land */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="max-w-screen-xl mx-auto p-4">
                  <AuthPage initialView="dashboard" />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Customer Protected Routes */}
          <Route
            path="/customer/my-bookings"
            element={
              <ProtectedRoute customerOnly={true}>
                <div className="max-w-screen-xl mx-auto p-4">
                  <MyBookingsPage />
                </div>
              </ProtectedRoute>
            }
          />

          {/* User Concerns */}
          <Route
            path="/user-concerns"
            element={
              <ProtectedRoute adminOnly={true}>
                <div className="max-w-screen-xl mx-auto p-4">
                  <AdminConcernsPage />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/bikes"
            element={
              <ProtectedRoute adminOnly={true}>
                <div className="max-w-screen-xl mx-auto p-4">
                  <BikeManagementPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bikes/new"
            element={
              <ProtectedRoute adminOnly={true}>
                <div className="max-w-screen-xl mx-auto p-4">
                  <AddBikePage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bikes/:bikeId/edit"
            element={
              <ProtectedRoute adminOnly={true}>
                <div className="max-w-screen-xl mx-auto p-4">
                  <EditBikePage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings/all"
            element={
              <ProtectedRoute adminOnly={true}>
                <div className="max-w-screen-xl mx-auto p-4">
                  <AllBookingsPage />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {shouldShowChatBot && <ChatBot />}
    </div>
  );
}

export default App;
