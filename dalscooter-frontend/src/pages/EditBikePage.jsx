import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import MessageBox from "../components/shared/MessageBox";
import DynamicKeyValueInput from "../components/shared/DynamicKeyValueInput"; // Import the new component

const EditBikePage = () => {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();

  const [model, setModel] = useState("");
  const [locationState, setLocationState] = useState("");
  const [ratePerHour, setRatePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [detailsArray, setDetailsArray] = useState([{ key: "", value: "" }]); // State for dynamic key-value pairs

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchBikeDetails = async () => {
      if (!isAuthenticated || !isAdmin) {
        setLoading(false);
        setError("Access Denied: You must be an administrator to edit bikes.");
        return;
      }

      setLoading(true);
      setError(null);

      const bikeDataFromState = location.state?.bikeData;

      if (bikeDataFromState && bikeDataFromState.bikeId === bikeId) {
        console.log("Using bike data from route state.");
        populateForm(bikeDataFromState);
        setLoading(false);
      } else {
        console.log("Bike data not in state, fetching all bikes as fallback.");
        try {
          const response = await api.get("/bikes/all");
          const bikeToEdit = response.data.bikes.find(
            (b) => b.bikeId === bikeId
          );

          if (bikeToEdit) {
            populateForm(bikeToEdit);
          } else {
            setError("Bike not found or you do not have permission.");
          }
        } catch (err) {
          console.error("Error fetching bike details as fallback:", err);
          setError("Failed to load bike details. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    const populateForm = (bike) => {
      setModel(bike.model || "");
      setLocationState(bike.location || "");
      setRatePerHour(bike.ratePerHour || "");
      setDescription(bike.description || "");
      setStatus(bike.status || "available");

      // Convert the 'details' object from the API into an array of { key, value } pairs
      if (
        bike.details &&
        typeof bike.details === "object" &&
        !Array.isArray(bike.details)
      ) {
        const convertedDetails = Object.entries(bike.details).map(
          ([key, value]) => ({
            key: String(key), // Ensure key is string
            value: String(value), // Ensure value is string
          })
        );
        setDetailsArray(
          convertedDetails.length > 0
            ? convertedDetails
            : [{ key: "", value: "" }]
        );
      } else {
        setDetailsArray([{ key: "", value: "" }]); // Default empty field
      }
    };

    if (!authLoading && bikeId) {
      fetchBikeDetails();
    }
  }, [bikeId, authLoading, isAuthenticated, isAdmin, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!model || !locationState || !ratePerHour || !status) {
      setError(
        "Please fill in all required fields (Model, Location, Rate, Status)."
      );
      setSubmitting(false);
      return;
    }

    // Convert detailsArray to a JSON object for the API
    const detailsObject = {};
    detailsArray.forEach((pair) => {
      if (pair.key.trim() !== "") {
        // Only include pairs with a non-empty key
        detailsObject[pair.key.trim()] = pair.value.trim();
      }
    });

    // Check for duplicate keys
    const keys = detailsArray
      .map((pair) => pair.key.trim())
      .filter((key) => key !== "");
    if (new Set(keys).size !== keys.length) {
      setError(
        "Duplicate keys found in Details. Please ensure all keys are unique."
      );
      setSubmitting(false);
      return;
    }

    try {
      const updatedBikeData = {
        model,
        location: locationState,
        ratePerHour: parseFloat(ratePerHour),
        description,
        status,
        details: detailsObject, // Use the converted object
      };

      await api.put(`/bikes/${bikeId}`, updatedBikeData);
      setSuccess("Bike updated successfully!");

      setTimeout(() => {
        navigate("/admin/bikes");
      }, 1500);
    } catch (err) {
      console.error("Error updating bike:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update bike. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-gray-700">
        <p>
          {authLoading
            ? "Checking authentication..."
            : "Loading bike details..."}
        </p>
      </div>
    );
  }

  if (
    error &&
    error !== "Access Denied: You must be an administrator to edit bikes."
  ) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md text-center">
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md shadow-md text-center">
        <p className="text-lg">
          Access Denied: You must be an administrator to edit bikes.
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
            Edit Bike
          </h2>

          {error &&
            error !==
              "Access Denied: You must be an administrator to edit bikes." && (
              <MessageBox message={error} type="error" />
            )}
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
                <input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#181F2A] border border-[#2C3440] text-white rounded-2xl px-6 py-4 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-semibold text-base shadow-xl hover:border-[#E7F133]/80 focus:ring-2 focus:ring-[#E7F133]/40"
                  required
                />
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
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
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
                disabled={submitting}
              >
                {submitting ? "Updating Bike..." : "Update Bike"}
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

export default EditBikePage;
