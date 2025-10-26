import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "aws-amplify";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isCustomer } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Redirect customers to homepage - only franchise operators should see dashboard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (isCustomer && !isAdmin) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, isAdmin, isCustomer, navigate]);

  // Fetch admin statistics for franchise operators
  useEffect(() => {
    const fetchAdminStats = async () => {
      if (!isAdmin) return;

      setStatsLoading(true);
      setStatsError(null);

      try {
        const response = await api.get("/admin/stats");
        setAdminStats(response.data.statistics);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        setStatsError("Failed to load statistics");
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Don't render anything for non-admin users (they should be redirected)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-auto flex flex-col items-center z-0">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>
      <div className="relative w-full flex flex-col items-center justify-center pt-27 pb-20 px-0 z-10">
        <div className="w-full max-w-8xl mx-auto">
          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-t border-gray-800 shadow-2xl p-8 animate-fadeInUp rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4 w-full">
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Franchise Operator Dashboard
              </h1>
              <span className="text-base text-[#E7F133] font-mono font-semibold">
                {user?.username || "Franchise Operator"}
              </span>
            </div>

            {/* Admin Statistics Section */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-[#E7F133] mb-6">
                System Statistics
              </h3>
              {statsLoading ? (
                <div className="flex justify-center items-center gap-6 animate-pulse">
                  <div className="h-10 w-28 bg-gray-800 rounded-xl"></div>
                  <div className="h-10 w-28 bg-gray-800 rounded-xl"></div>
                  <div className="h-10 w-28 bg-gray-800 rounded-xl"></div>
                  <div className="h-10 w-28 bg-gray-800 rounded-xl"></div>
                </div>
              ) : statsError ? (
                <p className="text-red-400 text-center font-semibold">
                  {statsError}
                </p>
              ) : adminStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-gray-900/80 p-6 rounded-2xl shadow flex flex-col items-center border-t-4 border-[#E7F133]">
                    <div className="text-3xl font-extrabold text-[#E7F133] mb-1">
                      {adminStats.totalUsers || 0}
                    </div>
                    <div className="text-xs text-gray-300 font-medium">
                      Total Users
                    </div>
                  </div>
                  <div className="bg-gray-900/80 p-6 rounded-2xl shadow flex flex-col items-center border-t-4 border-green-500">
                    <div className="text-3xl font-extrabold text-green-400 mb-1">
                      {adminStats.totalBikes || 0}
                    </div>
                    <div className="text-xs text-gray-300 font-medium">
                      Total Bikes
                    </div>
                  </div>
                  <div className="bg-gray-900/80 p-6 rounded-2xl shadow flex flex-col items-center border-t-4 border-purple-500">
                    <div className="text-3xl font-extrabold text-purple-300 mb-1">
                      {adminStats.totalBookings || 0}
                    </div>
                    <div className="text-xs text-gray-300 font-medium">
                      Total Bookings
                    </div>
                  </div>
                  <div className="bg-gray-900/80 p-6 rounded-2xl shadow flex flex-col items-center border-t-4 border-orange-400">
                    <div className="text-3xl font-extrabold text-orange-300 mb-1">
                      {adminStats.totalFeedbackEntries || 0}
                    </div>
                    <div className="text-xs text-gray-300 font-medium">
                      Feedback Entries
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center">
                  Unable to load statistics
                </p>
              )}
            </div>

            {/* Analytics Dashboard Section */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-[#E7F133] mb-6">
                Analytics Dashboard
              </h3>
              <div
                className="border border-gray-700 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-gray-900 to-gray-800"
                style={{ height: "400px", maxWidth: "100%" }}
              >
                <iframe
                  width="100%"
                  height="600vh"
                  src="https://lookerstudio.google.com/embed/reporting/b8060ec8-70b7-43ea-b868-02b010513f90/page/WocTF"
                  frameBorder="0"
                  allowFullScreen
                  sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  title="Analytics Dashboard"
                ></iframe>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
