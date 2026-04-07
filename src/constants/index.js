export const DESTINATIONS = [
  { label: '🏔️ 云南', text: '去云南', value: '云南' },
  { label: '🏖️ 三亚', text: '去三亚', value: '三亚' },
  { label: '🏯 北京', text: '去北京', value: '北京' },
];

export const DAYS_OPTIONS = [
  { label: '📅 3天', text: '3天', value: 3 },
  { label: '📅 5天', text: '5天', value: 5 },
  { label: '📅 7天', text: '7天', value: 7 },
];

export const TRAVELERS_OPTIONS = [
  { label: '👥 1人', text: '1个人', value: 1 },
  { label: '👥 2人', text: '2个人', value: 2 },
  { label: '👥 家庭', text: '4个人', value: 4 },
];

export const BUDGET_OPTIONS = [
  { label: '💰 经济', text: '预算经济', value: 'low' },
  { label: '💰 中等', text: '预算中等', value: 'medium' },
  { label: '💰 豪华', text: '预算豪华', value: 'high' },
];

export const QUICK_OPTIONS = [
  ...DESTINATIONS,
  ...DAYS_OPTIONS,
  ...TRAVELERS_OPTIONS,
  ...BUDGET_OPTIONS,
];

export const PARAM_LABELS = {
  destination: '目的地',
  days: '天数',
  travelers: '人数',
  budget: '预算',
  departure: '出发地',
};

export const PARAM_PATTERNS = {
  destination: /(?:去|到|前往)([^，,。？?]{2,6})/,
  days: /(\d+)\s*天/,
  travelers: /(\d+)\s*(?:人|个人)/,
  budget: {
    low: /低预算|经济|便宜|省钱/,
    medium: /中等|中档|适中/,
    high: /高预算|豪华|高端|奢华/,
  },
};

export const REQUIRED_FIELDS = ['destination', 'days', 'travelers'];

export const DEFAULT_WELCOME_MESSAGE = '嘿！我是你的旅行规划助手 ✨ 告诉我你的旅行想法，我来帮你安排得妥妥的～';

export const ASK_MESSAGES = {
  destination: '请问您想去哪里旅行呢？✈️',
  days: '计划玩几天呢？📅',
  travelers: '有几位同行？👥',
};
