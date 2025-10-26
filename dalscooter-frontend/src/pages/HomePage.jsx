import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import BikeDetailsModal from "../components/bikes/BikeDetailsModal";
import BookBikeModal from "../components/bikes/BookBikeModal";
import { useAuth } from "../context/AuthContext";
import electricScooterImg from "../assets/electric-scooter.svg";
import segwayBikeImg from "../assets/segway-bike.svg";

const HomePage = () => {
  const {
    isAuthenticated,
    isCustomer,
    isLoading: authLoading,
    user,
  } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBike, setSelectedBike] = useState(null);
  const [bikeToBook, setBikeToBook] = useState(null);

  const [locationFilter, setLocationFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [allUniqueLocations, setAllUniqueLocations] = useState([]);
  const [allUniqueModels, setAllUniqueModels] = useState([]);

  // Function to get the appropriate scooter image
  const getScooterImage = (model) => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes("segway") || modelLower.includes("gyroscooter")) {
      return segwayBikeImg;
    }
    return electricScooterImg;
  };

  const fetchBikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allBikesResponse = await api.get("/bikes/availability");
      const allFetchedBikes = allBikesResponse.data.bikes;

      setBikes(allFetchedBikes);

      const locations = new Set();
      const models = new Set();
      allFetchedBikes.forEach((bike) => {
        locations.add(bike.location);
        models.add(bike.model);
      });
      setAllUniqueLocations(Array.from(locations).sort());
      setAllUniqueModels(Array.from(models).sort());
    } catch (err) {
      console.error("Error fetching bikes:", err);
      setError(
        "Failed to load bikes. Please check your API URL and network connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);

  const handleBikeCardClick = (bike) => {
    setSelectedBike(bike);
  };

  const handleCloseDetailsModal = () => {
    setSelectedBike(null);
    fetchBikes();
  };

  const handleOpenBookModal = (bike) => {
    setBikeToBook(bike);
  };

  const handleCloseBookModal = () => {
    setBikeToBook(null);
  };

  const handleBookingSuccess = () => {
    handleCloseBookModal();
    fetchBikes();
  };

  const scrollToScooters = () => {
    const scootersSection = document.getElementById("available-scooters");
    if (scootersSection) {
      scootersSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const filteredBikes = bikes.filter((bike) => {
    const matchesLocation =
      locationFilter === "" || bike.location === locationFilter;
    const matchesModel = modelFilter === "" || bike.model === modelFilter;
    return matchesLocation && matchesModel;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-gray-700">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden flex items-center w-full">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 animate-pulse"></div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-[#E7F133] rotate-45 animate-bounce delay-100"></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-[#E7F133] rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-40 left-20 w-3 h-3 bg-[#E7F133] rotate-12 animate-bounce delay-500"></div>
          <div className="absolute bottom-20 right-10 w-5 h-5 bg-[#E7F133] rotate-45 animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-5 w-2 h-2 bg-[#E7F133] rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/3 right-5 w-3 h-3 bg-[#E7F133] rotate-12 animate-pulse delay-1200"></div>
        </div>

        <div className="relative w-full px-6 lg:px-12 pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Text Content */}
              <div className="text-left lg:text-left order-2 lg:order-1">
                <div className="animate-fadeInUp">
                  <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                    <span className="block animate-slideInLeft">
                      WELCOME TO
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932] animate-slideInRight delay-300">
                      DALSCOOTER
                    </span>
                    {isAuthenticated && (
                      <span className="block text-xl lg:text-2xl xl:text-3xl text-[#E7F133] mt-4 animate-fadeIn delay-500">
                        {user?.username || "Rider"}!
                      </span>
                    )}
                  </h1>

                  <div className="animate-fadeInUp delay-700">
                    <p className="text-lg lg:text-xl xl:text-2xl text-gray-300 mb-8 max-w-2xl">
                      <span className="block text-[#E7F133] font-semibold text-xl lg:text-2xl xl:text-3xl mb-2">
                        "Ride Smart, Ride Green, Ride DAL"
                      </span>
                      <span className="block">
                        Your premium electric scooter rental experience awaits
                      </span>
                    </p>
                  </div>

                  {!isAuthenticated && (
                    <div className="animate-fadeInUp delay-1000">
                      <button
                        onClick={scrollToScooters}
                        className="bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E7F133]/25"
                      >
                        START YOUR RIDE
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Scooter Visual */}
              <div className="order-1 lg:order-2 relative">
                <div className="relative animate-fadeInRight delay-500">
                  {/* Main Scooter Container */}
                  <div className="relative transform hover:scale-105 transition-transform duration-700">
                    {/* Glowing Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E7F133]/20 to-transparent rounded-3xl blur-3xl animate-pulse"></div>

                    {/* Scooter Representation */}
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 shadow-2xl">
                      {/* Scooter Icon/Image */}
                      <div className="text-center mb-6">
                        <div className="text-8xl lg:text-9xl xl:text-[12rem] animate-bounce-slow">
                          🛴
                        </div>
                      </div>

                      {/* Scooter Details */}
                      <div className="text-center space-y-4">
                        <h3 className="text-2xl lg:text-3xl font-bold text-[#E7F133]">
                          PREMIUM ELECTRIC
                        </h3>
                        <p className="text-gray-300 text-lg">
                          High Performance • Eco-Friendly • Smart Technology
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements Around Scooter */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#E7F133] rounded-full animate-ping"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#E7F133] rotate-45 animate-spin"></div>
                  <div className="absolute top-1/2 -right-8 w-4 h-4 bg-[#E7F133] rounded-full animate-bounce delay-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="text-[#E7F133] text-2xl">↓</div>
        </div>
      </div>

      {/* Available Scooters Section */}
      <div id="available-scooters" className="bg-black py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fadeInUp">
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                AVAILABLE
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932]">
                  SCOOTERS
                </span>
              </h2>
              <p className="text-gray-400 text-lg lg:text-xl max-w-3xl mx-auto">
                Discover our fleet of premium electric scooters ready for your
                next adventure
              </p>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-8 mb-12 border border-gray-700 animate-slideInUp delay-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label
                    htmlFor="locationFilter"
                    className="block text-sm font-bold text-[#E7F133] mb-3 uppercase tracking-wider"
                  >
                    📍 Filter by Location
                  </label>
                  <div className="relative">
                    <select
                      id="locationFilter"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full appearance-none border-2 border-gray-600 bg-gray-800 text-white rounded-2xl px-6 py-4 pr-12 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-lg group-hover:border-[#E7F133]/50"
                    >
                      <option value="">All Locations</option>
                      {allUniqueLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-[#E7F133]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <label
                    htmlFor="modelFilter"
                    className="block text-sm font-bold text-[#E7F133] mb-3 uppercase tracking-wider"
                  >
                    🛴 Filter by Model Type
                  </label>
                  <div className="relative">
                    <select
                      id="modelFilter"
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                      className="w-full appearance-none border-2 border-gray-600 bg-gray-800 text-white rounded-2xl px-6 py-4 pr-12 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-lg group-hover:border-[#E7F133]/50"
                    >
                      <option value="">All Models</option>
                      {allUniqueModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-[#E7F133]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scooter Grid */}
            {loading ? (
              <div className="text-center py-24">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#E7F133] border-t-transparent"></div>
                <p className="text-gray-400 text-xl mt-6">
                  Loading scooters...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-24">
                <p className="text-red-400 text-2xl font-semibold">{error}</p>
              </div>
            ) : filteredBikes.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-gray-400 text-2xl">
                  No scooters found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {filteredBikes.map((bike, index) => (
                  <div
                    key={bike.bikeId}
                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:shadow-[#E7F133]/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] group border border-gray-600 hover:border-[#E7F133]/50 animate-fadeInUp"
                    style={{ animationDelay: `${index * 150}ms` }}
                    onClick={() => handleBikeCardClick(bike)}
                  >
                    {/* Scooter Image Section */}
                    <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-700 relative overflow-hidden">
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#E7F133]/5 to-transparent"></div>

                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={getScooterImage(bike.model)}
                            alt={bike.model}
                            className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 filter drop-shadow-lg"
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${
                          bike.status === "available"
                            ? "bg-[#E7F133] text-black"
                            : "bg-red-500/90 text-white"
                        }`}
                      >
                        {bike.status === "available"
                          ? "✓ AVAILABLE"
                          : bike.status.replace(/_/g, " ").toUpperCase()}
                      </div>

                      {/* Subtle Corner Accent */}
                      <div className="absolute top-2 right-2 w-2 h-2 bg-[#E7F133] rounded-full opacity-60"></div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-[#E7F133] transition-colors duration-300">
                          {bike.model.toUpperCase()}
                        </h3>
                        <div className="flex items-baseline text-white">
                          <span className="font-bold text-2xl">
                            $
                            {bike.ratePerHour
                              ? parseFloat(bike.ratePerHour).toFixed(2)
                              : "N/A"}
                          </span>
                          <span className="text-gray-400 ml-1 text-sm">
                            /hour
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-300 mb-4">
                        <span className="text-[#E7F133] text-sm">📍</span>
                        <span className="text-sm">{bike.location}</span>
                      </div>

                      {bike.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {bike.description}
                        </p>
                      )}

                      <div className="flex items-center justify-end pt-4 border-t border-gray-700">
                        {isAuthenticated &&
                          isCustomer &&
                          bike.status === "available" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenBookModal(bike);
                              }}
                              className="bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-2 px-4 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E7F133]/30"
                            >
                              BOOK NOW
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedBike && (
        <BikeDetailsModal
          bike={selectedBike}
          onClose={handleCloseDetailsModal}
        />
      )}

      {bikeToBook && (
        <BookBikeModal
          bike={bikeToBook}
          onClose={handleCloseBookModal}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default HomePage;
