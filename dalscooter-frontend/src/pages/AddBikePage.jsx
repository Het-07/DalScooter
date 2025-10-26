// src/pages/AddBikePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import MessageBox from "../components/shared/MessageBox";
import DynamicKeyValueInput from "../components/shared/DynamicKeyValueInput";

const AddBikePage = () => {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [ratePerHour, setRatePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  // Initialized with one empty pair, ensuring 'value' is always an array
  const [detailsArray, setDetailsArray] = useState([{ key: "", value: "" }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Predefined scooter types
  const scooterTypes = ["Gyroscooter", "eBikes", "Segway"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!model || !location || !ratePerHour || !status) {
      setError(
        "Please fill in all required fields (Model, Location, Rate, Status)."
      );
      setLoading(false);
      return;
    }

    const detailsObject = {};
    detailsArray.forEach((pair) => {
      if (pair.key.trim() !== "") {
        detailsObject[pair.key.trim()] = pair.value.trim();
      }
    });

    const keys = detailsArray
      .map((pair) => pair.key.trim())
      .filter((key) => key !== "");
    if (new Set(keys).size !== keys.length) {
      setError(
        "Duplicate keys found in Details. Please ensure all keys are unique."
      );
      setLoading(false);
      return;
    }

    try {
      const newBikeData = {
        model,
        location,
        ratePerHour: parseFloat(ratePerHour),
        description,
        status,
        details: detailsObject,
      };

      await api.post("/bikes", newBikeData);
      setSuccess("Bike added successfully!");
      // Clear form
      setModel("");
      setLocation("");
      setRatePerHour("");
      setDescription("");
      setStatus("available");
      setDetailsArray([{ key: "", value: "" }]);

      setTimeout(() => {
        navigate("/admin/bikes");
      }, 1500);
    } catch (err) {
      console.error("Error adding bike:", err);
      setError(
        err.response?.data?.message || "Failed to add bike. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-700">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md shadow-md text-center">
        <p className="text-lg">
          Access Denied: You must be an administrator to add bikes.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-x-hidden flex items-center justify-center z-0">
      {/* Animated SVG Grid Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>
      <div className="relative w-full max-w-8xl mx-auto flex flex-col items-center justify-center pt-20 pb-10 px-4 z-10 min-h-screen">
        <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl p-12 animate-fadeInUp rounded-3xl">
          <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg mb-12 text-center">
            Add New Bike
          </h2>

          {error && <MessageBox message={error} type="error" />}
          {success && <MessageBox message={success} type="success" />}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-semibold text-[#E7F133] mb-2 uppercase tracking-wider"
                >
                  Scooter Type <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#181F2A] border border-[#2C3440] text-white rounded-2xl px-6 py-4 pr-12 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-semibold text-base shadow-xl hover:border-[#E7F133]/80 focus:ring-2 focus:ring-[#E7F133]/40 appearance-none"
                    required
                  >
                    <option value="" disabled>
                      Select a type
                    </option>
                    {scooterTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-[#181F2A] text-white"
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-6 top-1/2 transform -translate-y-1/2 text-[#E7F133] text-2xl group-focus-within:text-[#E7F133] transition-colors duration-200">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 10l5 5 5-5"
                        stroke="#E7F133"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-[#E7F133] mb-2 uppercase tracking-wider"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="ratePerHour"
                  className="block text-sm font-semibold text-[#E7F133] mb-2 uppercase tracking-wider"
                >
                  Rate per Hour ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="ratePerHour"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(e.target.value)}
                  className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg disabled:opacity-50 mt-6"
                disabled={loading}
              >
                {loading ? "Adding Bike..." : "Add Bike"}
              </button>
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-[#E7F133] mb-2 uppercase tracking-wider"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#181F2A] border border-[#2C3440] text-white rounded-2xl px-6 py-4 pr-12 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-semibold text-base shadow-xl hover:border-[#E7F133]/80 focus:ring-2 focus:ring-[#E7F133]/40 appearance-none"
                    required
                  >
                    <option value="available">Available</option>
                    <option value="in_maintenance">In Maintenance</option>
                    <option value="rented">Rented</option>
                    <option value="retired">Retired</option>
                  </select>
                  <span className="pointer-events-none absolute right-6 top-1/2 transform -translate-y-1/2 text-[#E7F133] text-2xl group-focus-within:text-[#E7F133] transition-colors duration-200">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 10l5 5 5-5"
                        stroke="#E7F133"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-[#E7F133] mb-2 uppercase tracking-wider"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                  placeholder="e.g., Our latest model with enhanced battery life..."
                ></textarea>
              </div>
              <DynamicKeyValueInput
                label="Details (Specifications)"
                value={detailsArray}
                onChange={setDetailsArray}
                placeholderKey="Key (e.g., maxSpeed)"
                placeholderValue="Value (e.g., 25 km/h)"
                inputClassName="border-2 border-gray-700 bg-gray-900 text-white rounded-xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base"
                addButtonClassName="bg-[#232B3A] hover:bg-[#E7F133] hover:text-black text-[#E7F133] font-bold py-3 px-4 rounded-2xl shadow-xl transition-all duration-300 text-base border-2 border-[#2C3440] hover:border-[#E7F133]"
                removeButtonClassName="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBikePage;
