import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recommendApi } from '../services/api';
import {
  PARAM_PATTERNS,
  REQUIRED_FIELDS,
  DEFAULT_WELCOME_MESSAGE,
  ASK_MESSAGES,
} from '../constants';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const useDialogStore = create(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now(),
      messages: [],
      collectedParams: { destination: '', days: null, travelers: null, budget: '', departure: '' },
      requiredFields: REQUIRED_FIELDS,
      isFetching: false,
      errorMessage: null,
      retryCount: 0,

      /**
       * Add a new message to the chat
       */
      addMessage: (role, content, products = null, options = {}) => {
        const newMessage = {
          id: Date.now() + Math.random(),
          role,
          content,
          timestamp: new Date().toISOString(),
          products: products || undefined,
          isError: options.isError || false,
          onRetry: options.onRetry || null,
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
        return newMessage;
      },

      /**
       * Update collected parameters
       */
      updateParams: (newParams) => {
        set((state) => ({
          collectedParams: { ...state.collectedParams, ...newParams },
        }));
        get().checkAndTriggerSearch();
      },

      /**
       * Reset error state
       */
      resetError: () => {
        set({ errorMessage: null, retryCount: 0 });
      },

      /**
       * Check if all required fields are collected
       */
      isAllRequiredCollected: () => {
        const { collectedParams, requiredFields } = get();
        return requiredFields.every((field) => {
          const value = collectedParams[field];
          return value !== null && value !== undefined && value !== '';
        });
      },

      /**
       * Check parameters and trigger search or ask for missing info
       */
      checkAndTriggerSearch: () => {
        if (get().isAllRequiredCollected() && !get().isFetching) {
          get().searchProducts();
        } else if (!get().isAllRequiredCollected()) {
          const missing = get().requiredFields.filter((f) => !get().collectedParams[f]);
          if (missing.length && get().messages[get().messages.length - 1]?.role !== 'assistant') {
            const askText = ASK_MESSAGES[missing[0]] || '请告诉我更多信息';
            if (askText) get().addMessage('assistant', askText);
          }
        }
      },

      /**
       * Search products with retry mechanism
       */
      searchProducts: async (retryAttempt = 0) => {
        if (get().isFetching) return;

        set({ isFetching: true, errorMessage: null });
        const { sessionId, collectedParams, messages } = get();
        const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

        try {
          const response = await recommendApi({
            sessionId,
            query: messages[messages.length - 1]?.content || '',
            collectedParams,
            history,
          });

          if (response.code === 0 && response.data) {
            get().addMessage('assistant', response.data.reply, response.data.products || []);
            set({ retryCount: 0 });
          } else {
            throw new Error(response.message || '推荐失败');
          }
        } catch (err) {
          if (retryAttempt < MAX_RETRIES) {
            // Retry with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryAttempt + 1)));
            set({ retryCount: retryAttempt + 1 });
            get().searchProducts(retryAttempt + 1);
            return;
          }

          // Max retries reached, show error with retry button
          set({ errorMessage: err.message });
          get().addMessage('assistant', '抱歉，网络开小差了，请稍后重试。', null, {
            isError: true,
            onRetry: () => {
              get().resetError();
              get().searchProducts(0);
            },
          });
        } finally {
          set({ isFetching: false });
        }
      },

      /**
       * Parse user input to extract parameters
       */
      parseUserInput: (text) => {
        const newParams = {};

        const destMatch = text.match(PARAM_PATTERNS.destination);
        if (destMatch) newParams.destination = destMatch[1];

        const dayMatch = text.match(PARAM_PATTERNS.days);
        if (dayMatch) newParams.days = parseInt(dayMatch[1]);

        const travelerMatch = text.match(PARAM_PATTERNS.travelers);
        if (travelerMatch) newParams.travelers = parseInt(travelerMatch[1]);

        if (PARAM_PATTERNS.budget.low.test(text)) newParams.budget = 'low';
        else if (PARAM_PATTERNS.budget.high.test(text)) newParams.budget = 'high';
        else if (PARAM_PATTERNS.budget.medium.test(text)) newParams.budget = 'medium';

        return newParams;
      },

      /**
       * Send a user message
       */
      sendMessage: (rawText) => {
        const text = rawText.trim();
        if (!text) return;

        get().addMessage('user', text);
        const parsed = get().parseUserInput(text);

        if (Object.keys(parsed).length) {
          get().updateParams(parsed);
        } else {
          get().checkAndTriggerSearch();
        }
      },

      /**
       * Clear chat history
       */
      clearChat: () => {
        set({
          messages: [],
          collectedParams: { destination: '', days: null, travelers: null, budget: '', departure: '' },
          errorMessage: null,
          retryCount: 0,
        });
      },
    }),
    {
      name: 'travel-assistant-session',
      partialize: (state) => ({
        sessionId: state.sessionId,
        collectedParams: state.collectedParams,
      }),
    }
  )
);

export default useDialogStore;