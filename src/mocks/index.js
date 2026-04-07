/**
 * Mock API Index
 * Central export for all mock functionality
 */

// Data exports
export {
  DESTINATIONS,
  BUDGET_LEVELS,
  PRODUCT_TEMPLATES,
  WELCOME_MESSAGES,
  FOLLOW_UP_QUESTIONS,
  GENERIC_REPLIES,
  ERROR_MESSAGES,
  MOCK_DELAY,
} from './data.js';

// Handler exports
export {
  recommendApi,
  getProductDetail,
  getDestinationSuggestions,
  getWelcomeMessage,
  getFollowUpQuestion,
  getErrorMessage,
} from './handlers.js';
