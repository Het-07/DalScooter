// src/services/api.js
import axios from 'axios';
import { apiGatewayUrl } from '../aws-config.js';

// Get API Gateway URL from configuration
const API_BASE_URL = apiGatewayUrl;

if (!API_BASE_URL) {
  console.error("API Gateway URL is not defined. Please check environment variables or configuration.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to set the Authorization header for authenticated requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
