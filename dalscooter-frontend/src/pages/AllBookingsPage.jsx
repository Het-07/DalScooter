import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import MessageBox from "../components/shared/MessageBox";
import BookingDetailsModal from "../components/bookings/BookingDetailsModal";

const AllBookingsPage = () => {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBookingRefCode, setSelectedBookingRefCode] = useState(null);

  const fetchAllBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/bookings/all");
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error("Error fetching all bookings:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load all bookings. Please ensure you are logged in as an Admin and the API is working."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchAllBookings();
    } else if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setError("You do not have permission to view this page.");
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin, fetchAllBookings]);

  const formatStatusName = (status) => {
    if (!status) return "N/A";
    return status
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/^./, (str) => str.toUpperCase());
  };

  // const handleRowClick = (bookingRefCode) => {
  //   setSelectedBookingRefCode(bookingRefCode);
  // };

  const handleCloseModal = () => {
    setSelectedBookingRefCode(null);
    // fetchAllBookings(); // Optionally re-fetch if you expect changes from modal interaction
  };

  const dateTimeOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-700">
        <p>
          {authLoading
            ? "Checking authentication..."
            : "Loading all bookings..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md text-center">
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6 bg-yellow-900/20 border border-yellow-500/30 text-yellow-300 rounded-xl shadow-xl text-center max-w-lg mx-auto mt-24">
        <p className="text-lg">
          Access Denied: You must be an administrator to view all bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden flex items-center z-0">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>
      <div className="relative w-full flex flex-col items-center justify-center pt-35 pb-10 px-0 z-10">
        <div className="w-full max-w-8xl mx-auto">
          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-t border-gray-800 shadow-2xl p-8 animate-fadeInUp rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4 w-full">
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                All Bookings
              </h1>
            </div>
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-center text-lg p-8">
                No bookings found in the system.
              </p>
            ) : (
              <div className="w-full max-h-[65vh] overflow-x-auto overflow-y-auto rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl scrollbar-thin scrollbar-thumb-[#E7F133]/40 scrollbar-track-gray-800">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Booking Ref Code
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        User ID
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Bike ID
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Bike Type
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Start Time (UTC)
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        End Time (UTC)
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Status
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Rate per Hour
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Total Cost
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Access Code
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      let durationInHours = "N/A";
                      let totalCost = "N/A";
                      if (
                        booking.startTime &&
                        booking.endTime &&
                        booking.ratePerHour
                      ) {
                        try {
                          const start = new Date(booking.startTime);
                          const end = new Date(booking.endTime);
                          const durationMs = end.getTime() - start.getTime();
                          if (durationMs > 0) {
                            durationInHours = durationMs / (1000 * 60 * 60);
                            totalCost = (
                              durationInHours * parseFloat(booking.ratePerHour)
                            ).toFixed(2);
                          } else {
                            durationInHours = "0";
                            totalCost = "0.00";
                          }
                        } catch (e) {
                          console.error(
                            "Error calculating duration/cost for booking:",
                            booking,
                            e
                          );
                        }
                      }
                      return (
                        <tr
                          key={booking.bookingReferenceCode}
                          className="transition-colors duration-200 hover:bg-[#E7F133]/10 border-b border-gray-800"
                        >
                          <td className="py-4 px-6 text-sm text-gray-200 font-mono">
                            {booking.bookingReferenceCode || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-200 font-mono">
                            {booking.userId || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-200 font-mono">
                            {booking.bikeId || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-[#E7F133] font-semibold">
                            {booking.bikeType || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-300">
                            {booking.startTime
                              ? new Date(booking.startTime).toLocaleString(
                                  "en-US",
                                  dateTimeOptions
                                )
                              : "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-300">
                            {booking.endTime
                              ? new Date(booking.endTime).toLocaleString(
                                  "en-US",
                                  dateTimeOptions
                                )
                              : "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold shadow-md border-2 transition-colors duration-200
                              ${
                                booking.status === "approved" ||
                                booking.status === "active"
                                  ? "bg-[#E7F133]/20 text-[#E7F133] border-[#E7F133]/60"
                                  : booking.status === "completed"
                                  ? "bg-blue-700/20 text-blue-300 border-blue-400/40"
                                  : booking.status === "cancelled" ||
                                    booking.status === "rejected"
                                  ? "bg-red-700/20 text-red-400 border-red-500/40"
                                  : "bg-yellow-600/20 text-yellow-300 border-yellow-400/40"
                              }
                            `}
                            >
                              {formatStatusName(booking.status)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-200">
                            $
                            {booking.ratePerHour
                              ? parseFloat(booking.ratePerHour).toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-200">
                            ${totalCost}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-200">
                            {booking.accessCode || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedBookingRefCode && (
        <BookingDetailsModal
          bookingReferenceCode={selectedBookingRefCode}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AllBookingsPage;
