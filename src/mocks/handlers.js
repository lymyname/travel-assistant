import {
  DESTINATIONS,
  BUDGET_LEVELS,
  PRODUCT_TEMPLATES,
  WELCOME_MESSAGES,
  FOLLOW_UP_QUESTIONS,
  GENERIC_REPLIES,
  ERROR_MESSAGES,
  MOCK_DELAY,
} from './data.js';

/**
 * Get random item from array
 */
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Get random delay within range
 */
const getDelay = () => {
  return Math.floor(Math.random() * (MOCK_DELAY.max - MOCK_DELAY.min) + MOCK_DELAY.min);
};

/**
 * Get product template based on days
 */
const getTemplatesByDays = (days) => {
  if (days <= 3) return PRODUCT_TEMPLATES.short;
  if (days <= 6) return PRODUCT_TEMPLATES.medium;
  return PRODUCT_TEMPLATES.long;
};

/**
 * Get destination info or default
 */
const getDestinationInfo = (dest) => {
  // Try exact match first
  if (DESTINATIONS[dest]) {
    return { name: dest, ...DESTINATIONS[dest] };
  }

  // Try partial match
  for (const [key, value] of Object.entries(DESTINATIONS)) {
    if (dest.includes(key) || key.includes(dest)) {
      return { name: key, ...value };
    }
  }

  // Return default with user input preserved
  return {
    name: dest,
    description: `${dest}之旅，发现不一样的风景`,
    images: [
      `https://picsum.photos/seed/${encodeURIComponent(dest)}1/400/300`,
      `https://picsum.photos/seed/${encodeURIComponent(dest)}2/400/300`,
      `https://picsum.photos/seed/${encodeURIComponent(dest)}3/400/300`,
    ],
    tags: ['风景', '人文', '美食'],
  };
};

/**
 * Calculate price based on budget, days, and travelers
 */
const calculatePrice = (basePrice, budget, days, travelers) => {
  const budgetConfig = BUDGET_LEVELS[budget] || BUDGET_LEVELS.medium;
  let price = basePrice * budgetConfig.multiplier;

  // Adjust for days
  if (days <= 3) price *= 0.8;
  else if (days >= 7) price *= 1.3;

  // Group discount for more travelers
  if (travelers >= 4) price *= 0.95;
  if (travelers >= 8) price *= 0.9;

  return Math.round(price);
};

/**
 * Generate products based on params
 */
const generateProducts = (params) => {
  const { destination, days, budget, travelers } = params;
  const destInfo = getDestinationInfo(destination);
  const templates = getTemplatesByDays(days || 5);
  const budgetConfig = BUDGET_LEVELS[budget] || BUDGET_LEVELS.medium;

  return templates.map((template, index) => {
    const price = calculatePrice(template.price, budget, days || 5, travelers || 1);

    return {
      id: `p${index + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${destInfo.name} · ${budgetConfig.label}${template.type}${days || 5}日游`,
      description: `${template.description}，入住${budgetConfig.hotelLevel}`,
      price,
      imageUrl: destInfo.images[index % destInfo.images.length],
      detailUrl: `/product/${encodeURIComponent(destInfo.name)}/${index + 1}`,
      tags: destInfo.tags,
      duration: days || 5,
      destination: destInfo.name,
    };
  });
};

/**
 * Generate reply message based on params and products
 */
const generateReply = (params, products) => {
  const { destination, days, travelers, budget, departure } = params;
  const destInfo = getDestinationInfo(destination);
  const budgetLabel = BUDGET_LEVELS[budget]?.label || '品质型';

  let reply = '';

  // Greeting
  if (departure) {
    reply += `从${departure}出发`;
    if (destination) reply += `前往${destination}`;
    reply += '，';
  } else if (destination) {
    reply += `${destination}，${destInfo.description}。`;
  }

  // Trip details
  if (days && travelers) {
    reply += `为您安排了${days}天的行程，适合${travelers}人出行。`;
  } else if (days) {
    reply += `${days}天的精彩行程，`;
  }

  // Budget
  if (budget) {
    reply += `${budgetLabel}住宿标准，`;
  }

  // Products summary
  if (products.length > 0) {
    const minPrice = Math.min(...products.map((p) => p.price));
    const maxPrice = Math.max(...products.map((p) => p.price));
    reply += `推荐${products.length}款产品，价格区间¥${minPrice.toLocaleString()}-¥${maxPrice.toLocaleString()}。`;
  }

  return reply || randomItem(GENERIC_REPLIES);
};

/**
 * Get welcome message
 */
export const getWelcomeMessage = () => randomItem(WELCOME_MESSAGES);

/**
 * Get follow up question for missing field
 */
export const getFollowUpQuestion = (field) => {
  const questions = FOLLOW_UP_QUESTIONS[field];
  return questions ? randomItem(questions) : '还有什么需要告诉我的吗？';
};

/**
 * Get error message
 */
export const getErrorMessage = (type = 'network') => {
  const messages = ERROR_MESSAGES[type];
  return Array.isArray(messages) ? randomItem(messages) : messages;
};

/**
 * Check if should simulate error (for testing)
 */
const shouldSimulateError = () => {
  // 5% chance to simulate error
  return Math.random() < 0.05;
};

/**
 * Main recommendation API mock
 */
export const recommendApi = async (payload) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, getDelay()));

  // Optionally simulate error (remove in production)
  if (shouldSimulateError() && import.meta.env.DEV) {
    throw new Error('Simulated network error');
  }

  const { collectedParams, query, history } = payload;

  // Check if we have enough info to recommend
  const hasDestination = !!collectedParams.destination;
  const hasDays = !!collectedParams.days;
  const hasTravelers = !!collectedParams.travelers;

  // If missing required fields, ask follow up questions
  if (!hasDestination && query) {
    return {
      code: 1,
      message: 'need_info',
      data: {
        reply: getFollowUpQuestion('destination'),
        needsParam: 'destination',
      },
    };
  }

  if (!hasDays && hasDestination) {
    return {
      code: 1,
      message: 'need_info',
      data: {
        reply: getFollowUpQuestion('days'),
        needsParam: 'days',
      },
    };
  }

  // Generate products if we have destination
  let products = [];
  if (hasDestination) {
    products = generateProducts(collectedParams);
  }

  // Generate reply
  const reply = generateReply(collectedParams, products);

  return {
    code: 0,
    message: 'success',
    data: {
      reply,
      products,
      suggestions: hasDestination ? ['查看更多产品', '调整预算', '更换日期'] : [],
    },
  };
};

/**
 * Get product detail mock
 */
export const getProductDetail = async (productId) => {
  await new Promise((resolve) => setTimeout(resolve, getDelay()));

  return {
    code: 0,
    data: {
      id: productId,
      name: '产品详情',
      description: '这是一个精心设计的旅行产品，包含住宿、交通、门票等。',
      itinerary: [
        { day: 1, title: '抵达', activities: ['接机', '入住酒店', '自由活动'] },
        { day: 2, title: '游览', activities: ['早餐', '景点A', '午餐', '景点B', '晚餐'] },
        { day: 3, title: '离开', activities: ['早餐', '自由活动', '送机'] },
      ],
      includes: ['住宿', '用餐', '门票', '导游', '保险'],
      excludes: ['机票', '个人消费'],
    },
  };
};

/**
 * Get destination suggestions
 */
export const getDestinationSuggestions = async (keyword) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const matches = Object.keys(DESTINATIONS).filter((dest) =>
    dest.includes(keyword) || keyword.includes(dest)
  );

  return {
    code: 0,
    data: matches.map((dest) => ({
      name: dest,
      ...DESTINATIONS[dest],
    })),
  };
};
