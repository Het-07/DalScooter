import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Auth } from "aws-amplify";

const Navbar = () => {
  const { isAuthenticated, isAdmin, isCustomer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 lg:p-6">
      <nav className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl max-w-8xl mx-auto">
        <div className="px-6 lg:px-12 py-4 flex justify-between items-center">
          {/* Left Side - Logo/Brand */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-white text-2xl lg:text-3xl font-bold tracking-tight hover:text-[#E7F133] transition-all duration-300"
            >
              <span className="bg-gradient-to-r from-white to-[#E7F133] bg-clip-text text-transparent">
                DalScooter
              </span>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Public Links */}
            <Link
              to="/"
              className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
            >
              BIKES
            </Link>

            {/* Authenticated Links */}
            {isAuthenticated && (
              <>
                {isCustomer && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                    >
                      DASHBOARD
                    </Link>
                    <Link
                      to="/customer/my-bookings"
                      className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                    >
                      MY BOOKINGS
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                    >
                      DASHBOARD
                    </Link>
                    <Link
                      to="/admin/bikes"
                      className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                    >
                      MANAGE BIKES
                    </Link>
                    <Link
                      to="/user-concerns"
                      className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                    >
                      CONCERNS
                    </Link>
                    <Link
                      to="/admin/bookings/all"
                      className="text-gray-300 hover:text-[#E7F133] px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                    >
                      ALL BOOKINGS
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Mobile Menu for Navigation Links */}
                <div className="lg:hidden">
                  <details className="relative">
                    <summary className="text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-full transition-all duration-300 font-medium cursor-pointer list-none">
                      ☰
                    </summary>
                    <div className="absolute right-0 top-12 bg-black/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl p-4 min-w-[200px]">
                      <Link
                        to="/"
                        className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10 mb-2"
                      >
                        BIKES
                      </Link>
                      {isCustomer && (
                        <>
                          <Link
                            to="/dashboard"
                            className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10 mb-2"
                          >
                            DASHBOARD
                          </Link>
                          <Link
                            to="/customer/my-bookings"
                            className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10 mb-2"
                          >
                            MY BOOKINGS
                          </Link>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <Link
                            to="/dashboard"
                            className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10 mb-2"
                          >
                            DASHBOARD
                          </Link>
                          <Link
                            to="/admin/bikes"
                            className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10 mb-2"
                          >
                            MANAGE BIKES
                          </Link>
                          <Link
                            to="/user-concerns"
                            className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10 mb-2"
                          >
                            CONCERNS
                          </Link>
                          <Link
                            to="/admin/bookings/all"
                            className="block text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-lg transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                          >
                            ALL BOOKINGS
                          </Link>
                        </>
                      )}
                    </div>
                  </details>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600/80 hover:bg-red-500 text-white px-4 lg:px-6 py-2.5 rounded-full transition-all duration-300 font-medium border border-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/25 text-sm lg:text-base"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
                {/* Mobile Menu for Guest Navigation */}
                <div className="lg:hidden">
                  <Link
                    to="/"
                    className="text-gray-300 hover:text-[#E7F133] px-3 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10"
                  >
                    BIKES
                  </Link>
                </div>

                {/* Guest Auth Buttons */}
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-[#E7F133] px-3 lg:px-4 py-2 rounded-full transition-all duration-300 font-medium hover:bg-[#E7F133]/10 text-sm lg:text-base"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  className="bg-[#E7F133] hover:bg-[#D1E129] text-black px-4 lg:px-6 py-2.5 rounded-full transition-all duration-300 font-bold hover:shadow-lg hover:shadow-[#E7F133]/25 transform hover:scale-105 text-sm lg:text-base"
                >
                  REGISTER
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
