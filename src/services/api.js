import axios from 'axios';
import {
  recommendApi as mockRecommendApi,
  getProductDetail as mockGetProductDetail,
  getDestinationSuggestions as mockGetDestinationSuggestions,
  getWelcomeMessage,
} from '../mocks/handlers.js';

// Create axios instance (for real API calls)
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// Use mock API in development or when explicitly enabled
const USE_MOCK = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Recommendation API
 * @param {Object} payload - Request payload
 * @param {string} payload.sessionId - Session ID
 * @param {string} payload.query - User query
 * @param {Object} payload.collectedParams - Collected parameters
 * @param {Array} payload.history - Chat history
 */
export const recommendApi = async (payload) => {
  if (USE_MOCK) {
    return mockRecommendApi(payload);
  }

  // Real API call
  const response = await request.post('/recommend', payload);
  return response.data;
};

/**
 * Get product details
 * @param {string} productId - Product ID
 */
export const getProductDetail = async (productId) => {
  if (USE_MOCK) {
    return mockGetProductDetail(productId);
  }

  const response = await request.get(`/products/${productId}`);
  return response.data;
};

/**
 * Get destination suggestions
 * @param {string} keyword - Search keyword
 */
export const getDestinationSuggestions = async (keyword) => {
  if (USE_MOCK) {
    return mockGetDestinationSuggestions(keyword);
  }

  const response = await request.get('/destinations/suggest', {
    params: { keyword },
  });
  return response.data;
};

/**
 * Get welcome message (always from mock for consistency)
 */
export { getWelcomeMessage };

/**
 * Check if mock mode is enabled
 */
export const isMockEnabled = () => USE_MOCK;
