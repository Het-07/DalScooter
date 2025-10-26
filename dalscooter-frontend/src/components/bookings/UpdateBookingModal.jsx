import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import MessageBox from "../shared/MessageBox";

const UpdateBookingModal = ({ booking, onClose, onUpdateSuccess }) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (booking) {
      // Function to format ISO string to YYYY-MM-DDTHH:MM for datetime-local input
      // This ensures the input shows the time in the user's local timezone
      const formatForDatetimeLocal = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        // Get the timezone offset in minutes and convert to milliseconds
        const offset = date.getTimezoneOffset() * 60000;
        // Adjust the date by the offset to get the local time's UTC equivalent
        // This makes the datetime-local input display the correct local time
        const localDate = new Date(date.getTime() - offset);
        // Return in YYYY-MM-DDTHH:MM format
        return localDate.toISOString().slice(0, 16);
      };

      setStartTime(formatForDatetimeLocal(booking.startTime));
      setEndTime(formatForDatetimeLocal(booking.endTime));
    }
  }, [booking]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!startTime || !endTime) {
      setError("Please select both start and end times.");
      setLoading(false);
      return;
    }

    // Convert datetime-local input (which is in local timezone) to UTC ISO string
    // The input '2025-07-27T12:00' is interpreted as 12:00 PM in the user's local timezone.
    // We need to convert this to its equivalent UTC ISO string for the API.
    const startUtc = new Date(startTime).toISOString();
    const endUtc = new Date(endTime).toISOString();

    if (new Date(startUtc) >= new Date(endUtc)) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        new_start_time: startUtc,
        new_end_time: endUtc,
      };

      await api.put(`/bookings/${booking.bookingReferenceCode}`, updateData);
      setSuccess("Booking updated successfully!");
      onUpdateSuccess(); // Notify parent to refresh bookings
      setTimeout(() => onClose(), 1500); // Close modal after success
    } catch (err) {
      console.error("Error updating booking:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-gray-700 animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-[#E7F133] text-3xl font-bold rounded-full w-8 h-8 flex items-center justify-center border border-gray-700"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
          Update Booking
        </h2>
        <p className="text-gray-300 mb-4">
          Booking Ref:{" "}
          <span className="font-semibold text-[#E7F133] font-mono">
            {booking.bookingReferenceCode}
          </span>
        </p>
        {error && <MessageBox message={error} type="error" />}
        {success && <MessageBox message={success} type="success" />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-semibold text-[#E7F133] mb-2"
            >
              New Start Time (Local)
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
              required
            />
          </div>
          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-semibold text-[#E7F133] mb-2"
            >
              New End Time (Local)
            </label>
            <input
              type="datetime-local"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg disabled:opacity-50 mt-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Booking"}
          </button>
        </form>
      </div>
    </div>
  );
};

UpdateBookingModal.propTypes = {
  booking: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
};

export default UpdateBookingModal;
