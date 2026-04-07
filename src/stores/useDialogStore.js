import { create } from 'zustand';
import { recommendApi } from '../services/api';

const useDialogStore = create((set, get) => ({
  sessionId: crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now(),
  messages: [],
  collectedParams: { destination: '', days: null, travelers: null, budget: '', departure: '' },
  requiredFields: ['destination', 'days', 'travelers'],
  isFetching: false,
  errorMessage: null,
  
  addMessage: (role, content, products = null) => {
    const newMessage = { id: Date.now() + Math.random(), role, content, timestamp: new Date().toISOString(), products: products || undefined };
    set((state) => ({ messages: [...state.messages, newMessage] }));
    return newMessage;
  },
  
  updateParams: (newParams) => {
    set((state) => ({ collectedParams: { ...state.collectedParams, ...newParams } }));
    get().checkAndTriggerSearch();
  },
  
  isAllRequiredCollected: () => {
    const { collectedParams, requiredFields } = get();
    return requiredFields.every(field => {
      const value = collectedParams[field];
      return value !== null && value !== undefined && value !== '';
    });
  },
  
  checkAndTriggerSearch: () => {
    if (get().isAllRequiredCollected() && !get().isFetching) {
      get().searchProducts();
    } else if (!get().isAllRequiredCollected()) {
      const missing = get().requiredFields.filter(f => !get().collectedParams[f]);
      if (missing.length && get().messages[get().messages.length - 1]?.role !== 'assistant') {
        let askText = '';
        if (missing.includes('destination')) askText = '请问您想去哪里旅行呢？✈️';
        else if (missing.includes('days')) askText = '计划玩几天呢？📅';
        else if (missing.includes('travelers')) askText = '有几位同行？👥';
        if (askText) get().addMessage('assistant', askText);
      }
    }
  },
  
  searchProducts: async () => {
    if (get().isFetching) return;
    set({ isFetching: true, errorMessage: null });
    const { sessionId, collectedParams, messages } = get();
    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    try {
      const response = await recommendApi({ sessionId, query: messages[messages.length-1]?.content || '', collectedParams, history });
      if (response.code === 0 && response.data) {
        get().addMessage('assistant', response.data.reply, response.data.products || []);
      } else throw new Error(response.message || '推荐失败');
    } catch (err) {
      set({ errorMessage: err.message });
      get().addMessage('assistant', '抱歉，网络开小差了，请稍后重试。');
    } finally {
      set({ isFetching: false });
    }
  },
  
  parseUserInput: (text) => {
    const newParams = {};
    const destMatch = text.match(/(?:去|到|前往)([^，,。？?]{2,6})/);
    if (destMatch) newParams.destination = destMatch[1];
    const dayMatch = text.match(/(\d+)\s*天/);
    if (dayMatch) newParams.days = parseInt(dayMatch[1]);
    const travelerMatch = text.match(/(\d+)\s*(?:人|个人)/);
    if (travelerMatch) newParams.travelers = parseInt(travelerMatch[1]);
    if (/低预算|经济/.test(text)) newParams.budget = 'low';
    else if (/高预算|豪华/.test(text)) newParams.budget = 'high';
    else if (/中等|中档/.test(text)) newParams.budget = 'medium';
    return newParams;
  },
  
  sendMessage: (rawText) => {
    const text = rawText.trim();
    if (!text) return;
    get().addMessage('user', text);
    const parsed = get().parseUserInput(text);
    if (Object.keys(parsed).length) get().updateParams(parsed);
    else get().checkAndTriggerSearch();
  },
}));

export default useDialogStore;