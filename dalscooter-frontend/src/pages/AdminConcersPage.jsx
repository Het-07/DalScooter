import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const AdminConcernsPage = () => {
  const [concerns, setConcerns] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [comment, setComment] = useState("");
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConcerns = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/admin/concerns?username=${user?.username}`
        );
        setConcerns(response?.data);
      } catch (err) {
        console.error("Error fetching concerns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConcerns();
  }, []);

  const handleResolve = async () => {
    if (!comment.trim()) return;

    setResolving(true);
    try {
      await api.post("/admin/concerns/resolve", {
        bookingId: selectedConcern.bookingId,
        message: comment,
        username: user?.username,
      });

      // Refresh concerns list
      const response = await api.get(
        `/admin/concerns?username=${user?.username}`
      );
      setConcerns(response?.data);

      setSelectedConcern(null);
      setComment("");
    } catch (err) {
      console.error("Error resolving concern:", err);
    }
    setResolving(false);
  };

  return (
    <div className="fixed inset-0 min-h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden flex items-center z-0">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>
      <div className="relative w-full flex flex-col items-center justify-center pt-5 pb-90 px-0 z-10">
        <div className="w-full max-w-8xl mx-auto">
          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-t border-gray-800 shadow-2xl p-8 animate-fadeInUp rounded-3xl">
            <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg mb-8 border-b border-gray-700 pb-6">
              Assigned Concerns
            </h2>
            {loading ? (
              <p className="text-gray-400 text-center text-lg p-8">
                Loading Concerns...
              </p>
            ) : concerns?.length === 0 ? (
              <p className="text-gray-400 text-center text-lg p-8">
                No Concerns
              </p>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#E7F133]/40 scrollbar-track-gray-800 pr-2">
                {concerns?.map((concern) => (
                  <div
                    key={concern.bookingId + concern.timestamp}
                    className="bg-gray-900/80 border border-gray-700 rounded-2xl shadow-lg p-6 flex flex-col gap-2 animate-fadeInUp"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2">
                      <span className="text-xs text-gray-400 font-mono">
                        Booking ID:{" "}
                        <span className="text-[#E7F133] font-semibold">
                          {concern.bookingId}
                        </span>
                      </span>
                      <span className="text-xs text-gray-400">
                        Status:{" "}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow border-2 ml-2
                        ${
                          concern.status === "resolved"
                            ? "bg-green-700/20 text-green-300 border-green-400/40"
                            : "bg-yellow-600/20 text-yellow-300 border-yellow-400/40"
                        }`}
                        >
                          {concern.status
                            .replace(/_/g, " ")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 text-gray-200 text-sm">
                      {concern.concern}
                    </div>
                    {concern.status !== "resolved" && (
                      <button
                        onClick={() => setSelectedConcern(concern)}
                        className="mt-4 self-end bg-[#E7F133] hover:bg-[#D1E129] text-black font-semibold py-2 px-6 rounded-full text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E7F133]/30 shadow border-2 border-[#E7F133]/40"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal */}
      {selectedConcern && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-700 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
              Resolve Concern
            </h3>
            <p className="mb-2 text-sm text-gray-300">
              <strong>Booking ID:</strong>{" "}
              <span className="text-[#E7F133] font-mono">
                {selectedConcern.bookingId}
              </span>
            </p>
            <p className="mb-4 text-sm text-gray-300">
              <strong>Message:</strong> {selectedConcern.concern}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add resolution comment..."
              className="w-full p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:border-[#E7F133] focus:ring-2 focus:ring-[#E7F133]/30 mb-4 resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedConcern(null);
                  setComment("");
                }}
                className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {resolving ? "Resolving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConcernsPage;
