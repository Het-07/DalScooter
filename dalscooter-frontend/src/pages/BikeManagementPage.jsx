import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api"; // Import your API service
import { useAuth } from "../context/AuthContext"; // To ensure admin access

const BikeManagementPage = () => {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch all bikes
  const fetchAllBikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the new API endpoint to get all bikes
      const response = await api.get("/bikes/all");
      setBikes(response.data.bikes);
    } catch (err) {
      console.error("Error fetching all bikes:", err);
      setError(
        "Failed to load bikes. Please ensure you are logged in as an Admin and the API is working."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if authenticated as admin
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchAllBikes();
    } else if (!authLoading && (!isAuthenticated || !isAdmin)) {
      // If not admin, set error or redirect (handled by ProtectedRoute, but good to have fallback)
      setError("You do not have permission to view this page.");
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin, fetchAllBikes]); // Depend on auth states and fetch function

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-300 bg-black">
        <p>{authLoading ? "Checking authentication..." : "Loading bikes..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl shadow-xl text-center max-w-lg mx-auto mt-24">
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6 bg-yellow-900/20 border border-yellow-500/30 text-yellow-300 rounded-xl shadow-xl text-center max-w-lg mx-auto mt-24">
        <p className="text-lg">
          Access Denied: You must be an administrator to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden flex items-center z-0">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>

      <div className="relative w-full flex flex-col items-center justify-center pt-35 pb-72 px-0 z-10">
        <div className="w-full max-w-8xl mx-auto">
          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-t border-gray-800 shadow-2xl p-8 animate-fadeInUp rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4 w-full">
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Bike Management
              </h1>
              <Link
                to="/admin/bikes/new"
                className="bg-[#E7F133] hover:bg-[#D1E129] text-black font-semibold py-3 px-8 rounded-full text-md transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg"
                style={{ boxShadow: "0 0 24px 2px #E7F13333" }}
              >
                + Add New Bike
              </Link>
            </div>

            {bikes.length === 0 ? (
              <p className="text-gray-400 text-center text-lg p-8">
                No bikes found in the system. Add one!
              </p>
            ) : (
              <div className="overflow-x-auto w-full rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Bike ID
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Model
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Location
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Rate/Hr
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Status
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bikes.map((bike, idx) => (
                      <tr
                        key={bike.bikeId}
                        className={`transition-colors duration-200 hover:bg-[#E7F133]/10 border-b border-gray-800 ${
                          idx % 2 === 0 ? "bg-gray-900/80" : "bg-gray-800/80"
                        }`}
                      >
                        <td className="py-4 px-6 text-sm text-gray-200 font-mono">
                          {bike.bikeId}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#E7F133] font-semibold">
                          {bike.model}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          {bike.location}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-200">
                          $
                          {bike.ratePerHour
                            ? parseFloat(bike.ratePerHour).toFixed(2)
                            : "N/A"}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-md border-2 transition-colors duration-200
                            ${
                              bike.status === "available"
                                ? "bg-[#E7F133]/20 text-[#E7F133] border-[#E7F133]/60"
                                : bike.status === "in_maintenance"
                                ? "bg-yellow-600/20 text-yellow-300 border-yellow-400/40"
                                : "bg-red-700/20 text-red-400 border-red-500/40"
                            }
                          `}
                          >
                            {bike.status
                              .replace(/_/g, " ")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <Link
                            to={`/admin/bikes/${bike.bikeId}/edit`}
                            state={{ bikeData: bike }}
                            className="text-[#E7F133] hover:text-white font-semibold underline underline-offset-4 transition-colors duration-200 drop-shadow-lg"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeManagementPage;
