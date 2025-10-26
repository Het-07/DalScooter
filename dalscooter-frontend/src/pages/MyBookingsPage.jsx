import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import MessageBox from "../components/shared/MessageBox";
import UpdateBookingModal from "../components/bookings/UpdateBookingModal";
import ConcernModal from "../model/ConcernModal";

const MyBookingsPage = () => {
  const { isAuthenticated, isCustomer, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [accessCodeModal, setAccessCodeModal] = useState({
    show: false,
    code: "",
    error: "",
  });
  const [cancelConfirmationModal, setCancelConfirmationModal] = useState({
    show: false,
    bookingRefCode: null,
    message: "",
  });
  const [updateBookingModal, setUpdateBookingModal] = useState({
    show: false,
    bookingToUpdate: null,
  });
  const [concernModal, setConcernModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState({});

  const fetchMyBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await api.get("/bookings/history");
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error("Error fetching my bookings:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isCustomer) {
      fetchMyBookings();
    } else if (!authLoading && (!isAuthenticated || !isCustomer)) {
      setError("You must be logged in as a Customer to view your bookings.");
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isCustomer, fetchMyBookings]);

  const formatStatusName = (status) => {
    if (!status) return "N/A";
    return status
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/^./, (str) => str.toUpperCase());
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

  const handleGetAccessCode = async (bookingRefCode) => {
    setAccessCodeModal({ show: true, code: "Loading...", error: "" });
    try {
      const response = await api.get(`/bookings/${bookingRefCode}/access-code`);
      setAccessCodeModal({
        show: true,
        code: response.data.accessCode,
        error: "",
      });
    } catch (err) {
      console.error("Error getting access code:", err);
      setAccessCodeModal({
        show: true,
        code: "",
        error: err.response?.data?.message || "Failed to get access code.",
      });
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelConfirmationModal.bookingRefCode) return;

    setCancelConfirmationModal((prev) => ({
      ...prev,
      message: "Cancelling...",
      show: true,
    }));
    setSuccessMessage(null);
    setError(null);

    try {
      await api.delete(`/bookings/${cancelConfirmationModal.bookingRefCode}`);
      setCancelConfirmationModal({
        show: false,
        bookingRefCode: null,
        message: "",
      });
      setSuccessMessage("Booking cancelled successfully!");
      fetchMyBookings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setCancelConfirmationModal({
        show: false,
        bookingRefCode: null,
        message: "",
      });
      setError(err.response?.data?.message || "Failed to cancel booking.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenUpdateModal = (booking) => {
    setUpdateBookingModal({ show: true, bookingToUpdate: booking });
  };

  const handleCloseUpdateModal = () => {
    setUpdateBookingModal({ show: false, bookingToUpdate: null });
  };

  const handleUpdateSuccess = () => {
    handleCloseUpdateModal();
    setSuccessMessage("Booking updated successfully!");
    fetchMyBookings();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-700">
        <p>
          {authLoading
            ? "Checking authentication..."
            : "Loading your bookings..."}
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !isCustomer) {
    return (
      <div className="p-6 bg-yellow-900/20 border border-yellow-500/30 text-yellow-300 rounded-xl shadow-xl text-center max-w-lg mx-auto mt-24">
        <p className="text-lg">
          Access Denied: You must be logged in as a Customer to view your
          bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden flex items-center z-0">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>
      <div className="relative w-full flex flex-col items-center justify-center pt-25 pb-90 px-0 z-10">
        <div className="w-full max-w-8xl mx-auto">
          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-t border-gray-800 shadow-2xl p-8 animate-fadeInUp rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-4 w-full">
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                My Bookings
              </h1>
            </div>
            {error && <MessageBox message={error} type="error" />}
            {successMessage && (
              <MessageBox message={successMessage} type="success" />
            )}
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-center text-lg p-8">
                You have no bookings yet.
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
                        Bike Type
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Bike Location
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
                      <th className="py-4 px-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                        Actions
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
                          <td className="py-4 px-6 text-sm text-[#E7F133] font-semibold">
                            {booking.bikeType || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-200">
                            {booking.location || "N/A"}
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
                          <td className="py-4 px-6 text-sm space-x-8">
                            <div className="flex space-x-2">
                              {(booking.status === "approved" ||
                                booking.status === "active") && (
                                <button
                                  onClick={() =>
                                    handleGetAccessCode(
                                      booking.bookingReferenceCode
                                    )
                                  }
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors shadow-md border border-indigo-400/40"
                                >
                                  Get Code
                                </button>
                              )}
                              {(booking.status === "pending_approval" ||
                                booking.status === "approved") && (
                                <button
                                  onClick={() =>
                                    setCancelConfirmationModal({
                                      show: true,
                                      bookingRefCode:
                                        booking.bookingReferenceCode,
                                      message:
                                        "Are you sure you want to cancel this booking?",
                                    })
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors shadow-md border border-red-400/40"
                                >
                                  Cancel
                                </button>
                              )}
                              {(booking.status === "pending_approval" ||
                                booking.status === "approved") && (
                                <button
                                  onClick={() => handleOpenUpdateModal(booking)}
                                  className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors shadow-md border border-gray-400/40"
                                >
                                  Update
                                </button>
                              )}
                            </div>
                            <button
                              className="mt-2 text-[#E7F133] hover:underline font-semibold"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setConcernModal(true);
                              }}
                            >
                              View Messages / Raise Concern
                            </button>
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
      {/* Modals */}
      {concernModal && (
        <ConcernModal
          bookingId={selectedBooking.bookingReferenceCode}
          onClose={() => {
            setSelectedBooking({});
            setConcernModal(false);
          }}
        />
      )}
      {accessCodeModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 relative text-center border border-gray-700 animate-fadeInUp">
            <button
              onClick={() =>
                setAccessCodeModal({ show: false, code: "", error: "" })
              }
              className="absolute top-3 right-3 text-gray-400 hover:text-[#E7F133] text-3xl font-bold rounded-full w-8 h-8 flex items-center justify-center border border-gray-700"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">Access Code</h2>
            {accessCodeModal.error ? (
              <MessageBox message={accessCodeModal.error} type="error" />
            ) : (
              <p className="text-4xl font-extrabold text-[#E7F133]">
                {accessCodeModal.code}
              </p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              Use this code to unlock your bike.
            </p>
          </div>
        </div>
      )}
      {cancelConfirmationModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 relative text-center border border-gray-700 animate-fadeInUp">
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Cancellation
            </h2>
            <p className="text-gray-300 mb-6">
              {cancelConfirmationModal.message}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() =>
                  setCancelConfirmationModal({
                    show: false,
                    bookingRefCode: null,
                    message: "",
                  })
                }
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md transition-colors border border-gray-500"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors border border-red-500"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {updateBookingModal.show && (
        <UpdateBookingModal
          booking={updateBookingModal.bookingToUpdate}
          onClose={handleCloseUpdateModal}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
