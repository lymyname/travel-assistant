import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recommendApi, getWelcomeMessage } from '../services/api.js';
import { chatWithAI } from '../services/aiService.js';
import {
  PARAM_PATTERNS,
  REQUIRED_FIELDS,
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
      isAIResponding: false,
      abortController: null,
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
          images: options.images || undefined,
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
       * Get AI response for general travel questions (with streaming)
       */
      askAI: async () => {
        if (get().isAIResponding) return;

        // Create abort controller for this request
        const abortController = new AbortController();
        set({ isAIResponding: true, abortController });

        const { messages } = get();

        // Build conversation history for AI
        const history = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role,
            content: m.content,
          }));

        // Create a placeholder message for streaming
        const streamingMessageId = Date.now() + Math.random();
        set((state) => ({
          messages: [...state.messages, {
            id: streamingMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
          }],
        }));

        try {
          let fullContent = '';

          const aiResponse = await chatWithAI(history, {
            signal: abortController.signal,
            onChunk: (chunk, full) => {
              fullContent = full;
              // Update the streaming message content
              set((state) => ({
                messages: state.messages.map(m =>
                  m.id === streamingMessageId
                    ? { ...m, content: fullContent }
                    : m
                ),
              }));
            },
          });

          // Check if request was aborted
          if (abortController.signal.aborted) {
            // Remove the streaming message if aborted
            set((state) => ({
              messages: state.messages.filter(m => m.id !== streamingMessageId),
            }));
            return;
          }

          // Finalize the message - remove streaming flag
          set((state) => ({
            messages: state.messages.map(m =>
              m.id === streamingMessageId
                ? { ...m, content: aiResponse.content || fullContent, isStreaming: false }
                : m
            ),
            isAIResponding: false,
            abortController: null,
          }));
        } catch (error) {
          // Check if request was aborted
          if (error.name === 'AbortError' || abortController.signal.aborted) {
            console.log('AI response aborted');
            // Remove the streaming message
            set((state) => ({
              messages: state.messages.filter(m => m.id !== streamingMessageId),
              isAIResponding: false,
              abortController: null,
            }));
            return;
          }

          console.error('AI Chat Error:', error);
          // Update with error message
          set((state) => ({
            messages: state.messages.map(m =>
              m.id === streamingMessageId
                ? { ...m, content: '抱歉，AI服务暂时不可用，请稍后重试。', isStreaming: false, isError: true }
                : m
            ),
            isAIResponding: false,
            abortController: null,
          }));
        }
      },

      /**
       * Update streaming content (for external use if needed)
       */
      updateStreamingContent: (messageId, content) => {
        set((state) => ({
          messages: state.messages.map(m =>
            m.id === messageId && m.isStreaming
              ? { ...m, content }
              : m
          ),
        }));
      },

      /**
       * Stop AI response generation
       */
      stopGenerating: () => {
        const { abortController, isAIResponding } = get();
        if (abortController && isAIResponding) {
          abortController.abort();
          set({ isAIResponding: false, abortController: null });
        }
      },

      /**
       * Send a user message
       */
      sendMessage: (rawText, options = {}) => {
        const text = rawText.trim();
        if (!text && !options.images) return;

        // Add user message (with images if provided)
        get().addMessage('user', text || '[图片]', null, { images: options.images });

        // Skip AI processing if explicitly told to (when we just want to add the message)
        if (options.skipAI) return;

        const parsed = get().parseUserInput(text);

        // Check if this looks like a travel planning request
        // Must have destination AND at least one other param, or match specific pattern
        const hasExplicitPlanningIntent = Object.keys(parsed).length >= 2 ||
          /\d+天/.test(text) || /\d+人/.test(text) || /预算|价格|多少钱/.test(text);

        // Check if input contains question words - should go to AI
        const hasQuestionWords = /[吗|呢|？|什么|怎么|如何|为什么|哪|多少]|\?/.test(text);

        if (Object.keys(parsed).length && hasExplicitPlanningIntent && !hasQuestionWords) {
          // User provided planning parameters, update and continue flow
          get().updateParams(parsed);
        } else if (hasQuestionWords || !Object.keys(parsed).length) {
          // No clear planning intent - use AI to respond
          get().askAI();
        } else if (get().isAllRequiredCollected()) {
          // All parameters collected, search products
          get().searchProducts();
        } else {
          // Fallback to AI
          get().askAI();
        }
      },

      /**
       * Clear chat history and reset to initial state with welcome message
       */
      clearChat: () => {
        set({
          messages: [],
          collectedParams: { destination: '', days: null, travelers: null, budget: '', departure: '' },
          errorMessage: null,
          retryCount: 0,
        });
        // Add welcome message after clearing
        const welcomeMsg = getWelcomeMessage();
        get().addMessage('assistant', welcomeMsg);
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