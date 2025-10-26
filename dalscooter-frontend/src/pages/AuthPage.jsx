import React, { useEffect } from "react";
import PropTypes from "prop-types";
import AuthHandler from "../components/auth/AuthHandler";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AuthPage = ({ initialView }) => {
  const { isAuthenticated, isAdmin, isCustomer, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and not trying to view 'dashboard', redirect them to dashboard.
    // This prevents authenticated users from seeing login/signup forms directly.
    if (!isLoading && isAuthenticated && initialView !== "dashboard") {
      // Redirect to dashboard based on role, or just to /dashboard
      if (isAdmin) {
        navigate("/dashboard", { replace: true });
      } else if (isCustomer) {
        navigate("/dashboard", { replace: true });
      }
    }
    // If user is NOT authenticated and initialView is 'dashboard', redirect to login
    if (!isLoading && !isAuthenticated && initialView === "dashboard") {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, isAdmin, isCustomer, initialView, navigate]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#E7F133] border-t-transparent mb-4"></div>
          <p className="text-white text-xl">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  // If authenticated and initialView is 'dashboard', render AuthHandler for dashboard view
  if (isAuthenticated && initialView === "dashboard") {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <AuthHandler initialView={initialView} className="w-full max-w-6xl" />
      </div>
    );
  }

  // If not authenticated, or if initialView is login/signup/verify/question/caesar, render AuthHandler
  // This ensures login/signup forms are shown if not authenticated
  if (
    !isAuthenticated ||
    ["login", "signup", "verify", "question", "caesar"].includes(initialView)
  ) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-40 w-4 h-4 bg-[#E7F133] rotate-45 animate-bounce delay-100"></div>
          <div className="absolute top-30 right-60 w-6 h-6 bg-[#E7F133] rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-30 left-100 w-3 h-3 bg-[#E7F133] rotate-12 animate-bounce delay-500"></div>
          <div className="absolute bottom-20 right-35 w-5 h-5 bg-[#E7F133] rotate-45 animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-25 w-2 h-2 bg-[#E7F133] rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 right-15 w-3 h-3 bg-[#E7F133] rotate-12 animate-pulse delay-1200"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-6">
          <AuthHandler
            initialView={initialView}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700"
          />
        </div>
      </div>
    );
  }

  // Fallback in case of unexpected state (should ideally not be reached)
  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <div className="text-center">
        <p className="text-white text-lg">
          Something went wrong or you don't have access.
        </p>
      </div>
    </div>
  );
};

AuthPage.propTypes = {
  initialView: PropTypes.string,
};

export default AuthPage;
