import React, { useState } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import MessageBox from "../shared/MessageBox";
import electricScooterImg from "../../assets/electric-scooter.svg";
import segwayBikeImg from "../../assets/segway-bike.svg";

const getScooterImage = (model) => {
  if (!model) return electricScooterImg;
  const lower = model.toLowerCase();
  if (lower.includes("segway")) return segwayBikeImg;
  // Add more model-image mappings as needed
  return electricScooterImg;
};

const BookBikeModal = ({ bike, onClose, onBookingSuccess }) => {
  const [startDate, setStartDate] = useState("");
  const [startTimeOnly, setStartTimeOnly] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTimeOnly, setEndTimeOnly] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!startDate || !startTimeOnly || !endDate || !endTimeOnly) {
      setError("Please select both start and end date/time.");
      setLoading(false);
      return;
    }
    // Combine date and time into ISO string
    const startUtc = new Date(`${startDate}T${startTimeOnly}`).toISOString();
    const endUtc = new Date(`${endDate}T${endTimeOnly}`).toISOString();
    if (new Date(startUtc) >= new Date(endUtc)) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }
    try {
      const bookingData = {
        bikeId: bike.bikeId,
        startTime: startUtc,
        endTime: endUtc,
      };
      await api.post("/bookings", bookingData);
      setSuccess(
        "Booking request submitted successfully! Please check 'My Bookings' for status."
      );
      onBookingSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!bike) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay with fade-in */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[4px] transition-all duration-500 animate-fadeIn"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl p-10 rounded-3xl overflow-y-auto max-h-[90vh] animate-fadeInUp custom-scrollbar">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-6 right-8 text-gray-400 hover:text-[#E7F133] text-4xl font-bold rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-200 z-10"
          aria-label="Close"
        >
          &times;
        </button>
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex-shrink-0 w-28 h-28 bg-gradient-to-br from-[#E7F133]/10 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#E7F133]/20">
            <img
              src={getScooterImage(bike.model)}
              alt={bike.model}
              className="w-20 h-20 object-contain drop-shadow-xl"
            />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-lg text-white text-center">
            Book {bike.model?.toUpperCase() || "SCOOTER"}
          </h2>
          <div className="flex flex-wrap gap-4 items-center justify-center text-lg">
            <span className="text-gray-300">📍 {bike.location}</span>
            <span className="text-[#E7F133] font-bold text-xl">
              $
              {bike.ratePerHour
                ? parseFloat(bike.ratePerHour).toFixed(2)
                : "N/A"}
              <span className="text-base text-gray-300 font-normal ml-1">
                /hour
              </span>
            </span>
          </div>
        </div>
        {/* Error/Success */}
        {error && <MessageBox message={error} type="error" />}
        {success && <MessageBox message={success} type="success" />}
        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          <div>
            <label className="block text-sm font-semibold text-[#E7F133] mb-2">
              Start Time
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                required
              />
              <input
                type="time"
                value={startTimeOnly}
                onChange={(e) => setStartTimeOnly(e.target.value)}
                className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#E7F133] mb-2">
              End Time
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                required
              />
              <input
                type="time"
                value={endTimeOnly}
                onChange={(e) => setEndTimeOnly(e.target.value)}
                className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg disabled:opacity-50 mt-2"
            disabled={loading}
          >
            {loading ? "Submitting Booking..." : "Book Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

BookBikeModal.propTypes = {
  bike: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onBookingSuccess: PropTypes.func.isRequired,
};

export default BookBikeModal;

/* Add to the bottom of the file (after export): */
<style jsx global>{`
  @keyframes modalPopIn {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-modalPopIn {
    animation: modalPopIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #e7f133 #232b3a;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    background: #232b3a;
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e7f133;
    border-radius: 8px;
    border: 2px solid #232b3a;
  }
`}</style>;
