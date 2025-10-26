import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ConcernModal({ bookingId, onClose }) {
  const { user } = useAuth();
  const [concerns, setConcerns] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConcerns();
    // eslint-disable-next-line
  }, [bookingId]);

  const fetchConcerns = async () => {
    try {
      const res = await api.get(`/concern?bookingId=${bookingId}`);
      setConcerns(res.data);
    } catch (err) {
      console.error("Error fetching concerns", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseConcern = async () => {
    if (!newMessage.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/concern`, { bookingId, concern: newMessage });
      setNewMessage("");
      fetchConcerns();
    } catch (err) {
      console.error("Error raising concern", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl max-w-lg w-full p-8 relative border border-gray-700 animate-fadeInUp">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-[#E7F133] text-3xl font-bold rounded-full w-8 h-8 flex items-center justify-center border border-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-white mb-4 break-all border-b border-gray-700 pb-2">
          Concerns for Booking: <tr />
          <span className="text-[#E7F133] font-mono">{bookingId}</span>
        </h2>
        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
            {concerns.length === 0 ? (
              <p className="text-gray-500 text-center">
                No concerns raised yet.
              </p>
            ) : (
              concerns.map((concern) => (
                <div
                  key={concern.id}
                  className="bg-gray-800/80 border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(concern.timestamp).toLocaleString()}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border-2 shadow-md ml-2
                      ${
                        concern.status === "resolved"
                          ? "bg-green-700/20 text-green-300 border-green-400/40"
                          : concern.status === "pending"
                          ? "bg-yellow-600/20 text-yellow-300 border-yellow-400/40"
                          : "bg-gray-700/20 text-gray-300 border-gray-500/40"
                      }
                    `}
                    >
                      {concern.status}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-200 text-base">
                    {concern.concern}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mt-6">
          <textarea
            className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base resize-none"
            placeholder="Raise a new concern..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            maxLength={500}
          ></textarea>
          <button
            onClick={handleRaiseConcern}
            className="mt-3 w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg disabled:opacity-50"
            disabled={submitting || !newMessage.trim()}
          >
            {submitting ? "Submitting..." : "Raise Concern"}
          </button>
        </div>
      </div>
      <style jsx global>{`
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
      `}</style>
    </div>
  );
}

export default ConcernModal;
