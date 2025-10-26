import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import MessageBox from "../shared/MessageBox";
import { useAuth } from "../../context/AuthContext";
import electricScooterImg from "../../assets/electric-scooter.svg";
import segwayBikeImg from "../../assets/segway-bike.svg";

const getScooterImage = (model) => {
  if (!model) return electricScooterImg;
  const lower = model.toLowerCase();
  if (lower.includes("segway")) return segwayBikeImg;
  // Add more model-image mappings as needed
  return electricScooterImg;
};

const BikeDetailsModal = ({ bike, onClose }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [feedbackError, setFeedbackError] = useState(null);
  const [sentimentSummary, setSentimentSummary] = useState(null);
  const [mostPopularSentiment, setMostPopularSentiment] = useState(null);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submitFeedbackError, setSubmitFeedbackError] = useState(null);
  const [submitFeedbackSuccess, setSubmitFeedbackSuccess] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoadingFeedback(true);
      setFeedbackError(null);
      try {
        const response = await api.get(`/feedback/${bike.bikeId}`);
        setFeedback(response.data.feedback);
        setSentimentSummary(response.data.sentimentSummary);
        setMostPopularSentiment(response.data.mostPopularSentiment);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setFeedbackError("Failed to load feedback. Please try again.");
      } finally {
        setLoadingFeedback(false);
      }
    };

    if (bike && bike.bikeId) {
      fetchFeedback();
    }
  }, [bike]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setSubmitFeedbackError(null);
    setSubmitFeedbackSuccess(null);

    if (!newComment.trim()) {
      setSubmitFeedbackError("Comment cannot be empty.");
      setSubmittingFeedback(false);
      return;
    }

    try {
      await api.post("/feedback", {
        bikeId: bike.bikeId,
        rating: newRating,
        comment: newComment,
      });
      setSubmitFeedbackSuccess("Feedback submitted successfully!");
      setNewRating(5);
      setNewComment("");
      const response = await api.get(`/feedback/${bike.bikeId}`);
      setFeedback(response.data.feedback);
      setSentimentSummary(response.data.sentimentSummary);
      setMostPopularSentiment(response.data.mostPopularSentiment);
      setTimeout(() => setSubmitFeedbackSuccess(null), 3000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setSubmitFeedbackError(
        err.response?.data?.message ||
          "Failed to submit feedback. Please try again."
      );
      setTimeout(() => setSubmitFeedbackError(null), 5000);
    } finally {
      setSubmittingFeedback(false);
    }
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

  const formatStatusName = (status) => {
    if (!status) return "N/A";
    return status
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/^./, (str) => str.toUpperCase());
  };

  if (!bike) return null;

  // Calculate percentage for the most popular sentiment
  const totalFeedbackCount = feedback.length;
  const mostPopularSentimentPercentage =
    mostPopularSentiment && sentimentSummary && totalFeedbackCount > 0
      ? (
          (sentimentSummary[mostPopularSentiment] / totalFeedbackCount) *
          100
        ).toFixed(0)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay with fade-in */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[4px] transition-all duration-500 animate-fadeIn"
        onClick={onClose}
      ></div>
      {/* Modal content with pop/scale transition */}
      <div className="relative w-full max-w-3xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl p-10 rounded-3xl overflow-y-auto max-h-[90vh] animate-fadeInUp scale-95 opacity-0 animate-modalPopIn custom-scrollbar">
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
        <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
          {/* Scooter Image */}
          <div className="flex-shrink-0 w-40 h-40 bg-gradient-to-br from-[#E7F133]/10 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#E7F133]/20">
            <img
              src={getScooterImage(bike.model)}
              alt={bike.model}
              className="w-32 h-32 object-contain drop-shadow-xl"
            />
          </div>
          {/* Main Info */}
          <div className="flex-1 space-y-2 text-white">
            <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-lg mb-2">
              {bike.model?.toUpperCase() || "SCOOTER"}
            </h2>
            <div className="flex flex-wrap gap-4 items-center text-lg">
              <span className="px-4 py-1 rounded-full bg-[#E7F133]/20 text-[#E7F133] font-bold border border-[#E7F133]/40 text-base">
                {bike.status === "available"
                  ? "✓ AVAILABLE"
                  : bike.status?.replace(/_/g, " ").toUpperCase()}
              </span>
              <span className="text-gray-300 font-mono">
                ID: <span className="text-white">{bike.bikeId}</span>
              </span>
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
        </div>

        {/* Description & Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-lg font-semibold text-[#E7F133] mb-2 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-gray-300 text-base leading-relaxed bg-gray-900 rounded-xl p-4 border border-gray-700 min-h-[60px]">
              {bike.description || "No description provided."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#E7F133] mb-2 uppercase tracking-wider">
              Specifications
            </h3>
            {bike.details && Object.keys(bike.details).length > 0 ? (
              <ul className="list-disc list-inside text-gray-300 space-y-1 bg-gray-900 rounded-xl p-4 border border-gray-700">
                {Object.entries(bike.details).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-bold text-white">
                      {formatStatusName(key)}:
                    </span>{" "}
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No specifications available.</p>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-[#E7F133] mb-6">
            Customer Feedback
          </h3>
          {mostPopularSentiment && totalFeedbackCount > 0 && (
            <div className="mb-4 p-3 bg-[#E7F133]/10 rounded-lg border border-[#E7F133]/30 text-[#E7F133] font-semibold">
              Overall Sentiment:{" "}
              <span className="ml-2 font-bold">
                {formatStatusName(mostPopularSentiment)} (
                {mostPopularSentimentPercentage}%)
              </span>
            </div>
          )}
          {loadingFeedback ? (
            <p className="text-gray-400">Loading feedback...</p>
          ) : feedbackError ? (
            <p className="text-red-500">{feedbackError}</p>
          ) : feedback.length === 0 ? (
            <p className="text-gray-400">No feedback yet for this bike.</p>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {feedback.map((item) => (
                <div
                  key={item.feedbackId}
                  className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                    <span className="font-semibold text-[#E7F133]">
                      Rating: {item.rating} / 5
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString(
                        "en-US",
                        dateTimeOptions
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300 italic mb-2">"{item.comment}"</p>
                  <p className="text-sm text-gray-500">
                    By:{" "}
                    {item.userName ||
                      (item.userId
                        ? item.userId.substring(0, 8) + "..."
                        : "Anonymous")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Submission Form (only for authenticated CUSTOMER users) */}
        {isAuthenticated && isCustomer && (
          <div className="mt-8 border-t border-gray-700 pt-6">
            <h3 className="text-2xl font-bold text-[#E7F133] mb-4">
              Submit Your Feedback
            </h3>
            {submitFeedbackError && (
              <MessageBox message={submitFeedbackError} type="error" />
            )}
            {submitFeedbackSuccess && (
              <MessageBox message={submitFeedbackSuccess} type="success" />
            )}
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-semibold text-[#E7F133] mb-2"
                >
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  min="1"
                  max="5"
                  value={newRating}
                  onChange={(e) => setNewRating(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-semibold text-[#E7F133] mb-2"
                >
                  Comment
                </label>
                <textarea
                  id="comment"
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                  placeholder="Share your experience..."
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg disabled:opacity-50 mt-2"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

BikeDetailsModal.propTypes = {
  bike: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default BikeDetailsModal;

/* Add to the bottom of the file (after export): */
/* Tailwind CSS keyframes for modal pop-in */
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
