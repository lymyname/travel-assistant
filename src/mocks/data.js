/**
 * Mock data for travel recommendations
 */

// Destination specific data
export const DESTINATIONS = {
  '云南': {
    description: '彩云之南，感受大自然的鬼斧神工',
    images: [
      'https://picsum.photos/seed/yunnan1/400/300',
      'https://picsum.photos/seed/yunnan2/400/300',
      'https://picsum.photos/seed/yunnan3/400/300',
    ],
    tags: ['古镇', '雪山', '民族风情'],
  },
  '三亚': {
    description: '阳光沙滩，度假天堂',
    images: [
      'https://picsum.photos/seed/sanya1/400/300',
      'https://picsum.photos/seed/sanya2/400/300',
      'https://picsum.photos/seed/sanya3/400/300',
    ],
    tags: ['海滩', '潜水', '度假村'],
  },
  '北京': {
    description: '千年古都，历史文化之旅',
    images: [
      'https://picsum.photos/seed/beijing1/400/300',
      'https://picsum.photos/seed/beijing2/400/300',
      'https://picsum.photos/seed/beijing3/400/300',
    ],
    tags: ['故宫', '长城', '胡同'],
  },
  '上海': {
    description: '魔都风情，现代都市体验',
    images: [
      'https://picsum.photos/seed/shanghai1/400/300',
      'https://picsum.photos/seed/shanghai2/400/300',
      'https://picsum.photos/seed/shanghai3/400/300',
    ],
    tags: ['外滩', '迪士尼', '美食'],
  },
  '成都': {
    description: '天府之国，美食与熊猫',
    images: [
      'https://picsum.photos/seed/chengdu1/400/300',
      'https://picsum.photos/seed/chengdu2/400/300',
      'https://picsum.photos/seed/chengdu3/400/300',
    ],
    tags: ['熊猫', '火锅', '慢生活'],
  },
  '西安': {
    description: '十三朝古都，丝路起点',
    images: [
      'https://picsum.photos/seed/xian1/400/300',
      'https://picsum.photos/seed/xian2/400/300',
      'https://picsum.photos/seed/xian3/400/300',
    ],
    tags: ['兵马俑', '古城墙', '面食'],
  },
};

// Budget level configurations
export const BUDGET_LEVELS = {
  low: { multiplier: 0.7, label: '经济型', hotelLevel: '舒适型酒店' },
  medium: { multiplier: 1, label: '品质型', hotelLevel: '四星级酒店' },
  high: { multiplier: 1.5, label: '豪华型', hotelLevel: '五星级酒店' },
};

// Product templates by duration
export const PRODUCT_TEMPLATES = {
  short: [ // 1-3 days
    { type: '经典', description: '精华景点一网打尽', price: 1280 },
    { type: '休闲', description: '慢节奏深度体验', price: 1580 },
  ],
  medium: [ // 4-6 days
    { type: '经典', description: '核心景点全覆盖，舒适酒店', price: 2980 },
    { type: '深度', description: '特色民宿+小众路线', price: 3580 },
    { type: '亲子', description: '适合全家出游，行程轻松', price: 3280 },
  ],
  long: [ // 7+ days
    { type: '全景', description: '深度环游，不留遗憾', price: 5280 },
    { type: '摄影', description: '专业摄影点位，记录美好', price: 5880 },
    { type: '轻奢', description: '高端住宿，尊贵体验', price: 6880 },
  ],
};

// Welcome messages
export const WELCOME_MESSAGES = [
  '嘿！我是你的旅行规划助手 ✨ 告诉我你的旅行想法，我来帮你安排得妥妥的～',
  '你好呀！想去哪里玩？告诉我目的地、天数和人数，我来帮你规划！',
  '准备出发了吗？✈️ 说出你的旅行计划，让我为你推荐最合适的行程！',
];

// Follow up questions by missing field
export const FOLLOW_UP_QUESTIONS = {
  destination: [
    '请问您想去哪里旅行呢？✈️',
    '目的地是哪里呀？想看海还是看山？',
    '想好了去哪里玩了吗？',
  ],
  days: [
    '计划玩几天呢？📅',
    '打算游玩多少天？',
    '行程时间大概多久？',
  ],
  travelers: [
    '有几位同行？👥',
    '出行人数是多少呢？',
    '几个人一起旅行呀？',
  ],
  budget: [
    '对住宿有什么要求吗？💰',
    '预算大概是怎样的？',
    '想要什么价位的行程？',
  ],
};

// Generic replies when no specific info
export const GENERIC_REPLIES = [
  '收到！还有什么需求可以告诉我哦～',
  '好的，继续补充信息，我就能帮你推荐啦！',
  '了解了！再告诉我一些细节吧～',
];

// Error messages
export const ERROR_MESSAGES = {
  network: [
    '抱歉，网络开小差了，请稍后重试。',
    '网络有点问题，能不能再试一次？',
    '连接不稳定，稍后再试一下吧～',
  ],
  invalid: '抱歉，我好像没理解，换个说法试试？',
  service: '服务暂时不可用，请稍后再试。',
};

// Mock delay configuration (ms)
export const MOCK_DELAY = {
  min: 500,
  max: 1500,
};
