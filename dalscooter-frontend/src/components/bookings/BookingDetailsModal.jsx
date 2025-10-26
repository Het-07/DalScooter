import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../../services/api';
import MessageBox from '../shared/MessageBox';

const BookingDetailsModal = ({ bookingReferenceCode, onClose }) => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/bookings/${bookingReferenceCode}/bike-details`);
        setBookingData(response.data); 
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError(err.response?.data?.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    if (bookingReferenceCode) {
      fetchDetails();
    }
  }, [bookingReferenceCode]);

  const formatStatusName = (status) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/-/g, ' ').replace(/^./, str => str.toUpperCase());
  };

  // Date formatting options for consistent display (e.g., YYYY-MM-DD HH:MM)
  const dateTimeOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false, // Use 24-hour format
    timeZone: 'UTC' // Display in UTC to match API input/output if API is UTC
  };

  if (!bookingReferenceCode) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl font-bold rounded-full w-10 h-10 flex items-center justify-center"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">Booking Details</h2>

        {loading ? (
          <p className="text-gray-600 text-center text-lg p-4">Loading booking details...</p>
        ) : error ? (
          <MessageBox message={error} type="error" />
        ) : bookingData ? (
          <div className="space-y-6">
            {/* Booking Information */}
            {bookingData.bookingDetails && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                  <p><strong>Ref Code:</strong> {bookingData.bookingDetails.bookingReferenceCode || 'N/A'}</p>
                  <p><strong>User ID:</strong> {bookingData.bookingDetails.userId || 'N/A'}</p> {/* Removed substring */}
                  <p><strong>Bike ID:</strong> {bookingData.bookingDetails.bikeId || 'N/A'}</p> {/* Removed substring */}
                  <p><strong>Bike Type:</strong> {bookingData.bookingDetails.bikeType || 'N/A'}</p>
                  <p><strong>Start Time:</strong> {bookingData.bookingDetails.startTime ? new Date(bookingData.bookingDetails.startTime).toLocaleString('en-US', dateTimeOptions) : 'N/A'}</p>
                  <p><strong>End Time:</strong> {bookingData.bookingDetails.endTime ? new Date(bookingData.bookingDetails.endTime).toLocaleString('en-US', dateTimeOptions) : 'N/A'}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      bookingData.bookingDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                      bookingData.bookingDetails.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      bookingData.bookingDetails.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      bookingData.bookingDetails.status === 'cancelled' || bookingData.bookingDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatStatusName(bookingData.bookingDetails.status)}
                    </span>
                  </p>
                  <p><strong>Total Cost:</strong> ${bookingData.bookingDetails.totalCost ? parseFloat(bookingData.bookingDetails.totalCost).toFixed(2) : 'N/A'}</p>
                  <p><strong>Access Code:</strong> {bookingData.bookingDetails.accessCode || 'N/A'}</p>
                  <p><strong>Created At:</strong> {bookingData.bookingDetails.createdAt ? new Date(bookingData.bookingDetails.createdAt).toLocaleString('en-US', dateTimeOptions) : 'N/A'}</p>
                  {bookingData.bookingDetails.approvedAt && <p><strong>Approved At:</strong> {new Date(bookingData.bookingDetails.approvedAt).toLocaleString('en-US', dateTimeOptions)}</p>}
                  {bookingData.bookingDetails.rejectedReason && <p><strong>Rejected Reason:</strong> {bookingData.bookingDetails.rejectedReason}</p>}
                </div>
              </div>
            )}

            {/* Bike Details (from the API response) */}
            {bookingData.bikeDetails && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Associated Bike Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                  <p><strong>Model:</strong> {bookingData.bikeDetails.model || 'N/A'}</p>
                  <p><strong>Location:</strong> {bookingData.bikeDetails.location || 'N/A'}</p>
                  <p><strong>Current Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      bookingData.bikeDetails.status === 'available' ? 'bg-green-100 text-green-800' :
                      bookingData.bikeDetails.status === 'in_maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formatStatusName(bookingData.bikeDetails.status)}
                    </span>
                  </p>
                  <p><strong>Rate/Hour:</strong> ${bookingData.bikeDetails.ratePerHour ? parseFloat(bookingData.bikeDetails.ratePerHour).toFixed(2) : 'N/A'}</p>
                  {bookingData.bikeDetails.description && <p className="col-span-1 md:col-span-2"><strong>Description:</strong> {bookingData.bikeDetails.description}</p>}

                  {bookingData.bikeDetails.details && Object.keys(bookingData.bikeDetails.details).length > 0 && (
                    <div className="col-span-1 md:col-span-2 mt-2">
                      <h4 className="font-semibold text-gray-800 mb-1">Specifications:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 ml-4">
                        {Object.entries(bookingData.bikeDetails.details).map(([key, value]) => (
                          <li key={key}><strong>{formatStatusName(key)}:</strong> {value}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 text-center text-lg p-4">No booking details available.</p>
        )}
      </div>
    </div>
  );
};

BookingDetailsModal.propTypes = {
  bookingReferenceCode: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BookingDetailsModal;