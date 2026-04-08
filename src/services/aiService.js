import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

// AI Provider types
export const AI_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  CUSTOM: 'custom',
  MOCK: 'mock',
};

// Get AI provider from environment
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || AI_PROVIDERS.MOCK;
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;
const AI_API_URL = import.meta.env.VITE_AI_API_URL;
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'claude-3-haiku-20240307';

// System prompt for travel assistant
const SYSTEM_PROMPT = `你是专业的旅行规划助手，具有丰富的旅游知识。你可以：
1. 回答关于目的地、景点、美食、住宿的问题
2. 提供旅行建议、行程规划、注意事项
3. 推荐当地特色体验和隐藏景点
4. 解答签证、交通、天气等实用信息

请用友好、专业的方式回答，适当使用emoji增加亲和力。如果用户询问具体产品价格，建议他们使用主界面的旅行规划功能。`;

/**
 * Mock AI responses for development
 */
const getMockAIResponse = async (messages) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const lastMessage = messages[messages.length - 1]?.content || '';
  const lowerMsg = lastMessage.toLowerCase();

  // Simple keyword-based responses
  if (lowerMsg.includes('签证') || lowerMsg.includes('护照')) {
    return {
      role: 'assistant',
      content: '🛂 签证信息：\n\n不同目的地签证要求不同：\n• **免签/落地签**：泰国、新加坡、马尔代夫等\n• **电子签**：土耳其、印度、澳大利亚等\n• **纸质签证**：美国、加拿大、申根国家等\n\n建议提前1-2个月准备签证材料，具体可查询各国领事馆官网。需要我详细介绍哪个国家？',
    };
  }

  if (lowerMsg.includes('天气') || lowerMsg.includes('气候') || lowerMsg.includes('温度')) {
    return {
      role: 'assistant',
      content: '🌤️ 关于旅行天气：\n\n• **春季(3-5月)**：适合日本赏樱、荷兰郁金香\n• **夏季(6-8月)**：北欧、北海道避暑，海岛度假\n• **秋季(9-11月)**：新疆喀纳斯、加拿大枫叶、韩国首尔\n• **冬季(12-2月)**：东北滑雪、海南避寒、北海道温泉\n\n你想了解哪个目的地的具体天气情况？',
    };
  }

  if (lowerMsg.includes('美食') || lowerMsg.includes('吃') || lowerMsg.includes('餐厅')) {
    return {
      role: 'assistant',
      content: '🍜 美食推荐：\n\n• **成都**：火锅、串串香、担担面、龙抄手\n• **西安**：肉夹馍、凉皮、羊肉泡馍、biangbiang面\n• **广州**：早茶、烧鹅、肠粉、双皮奶\n• **北京**：烤鸭、炸酱面、豆汁、卤煮\n\n想要更详细的美食攻略吗？告诉我你想去哪座城市！',
    };
  }

  if (lowerMsg.includes('预算') || lowerMsg.includes('多少钱') || lowerMsg.includes('费用')) {
    return {
      role: 'assistant',
      content: '💰 旅行预算参考（人均）：\n\n• **经济型**：¥2000-3000/人/周\n  - 选择青旅或民宿\n  - 公共交通出行\n  - 当地小吃为主\n\n• **舒适型**：¥4000-6000/人/周\n  - 精品酒店或度假村\n  - 部分包车游览\n  - 特色餐厅体验\n\n• **豪华型**：¥8000+/人/周\n  - 五星酒店或别墅\n  - 全程专车服务\n  - 米其林餐厅\n\n想要获取具体行程报价，可以使用主界面的旅行规划功能哦！',
    };
  }

  if (lowerMsg.includes('亲子') || lowerMsg.includes('小孩') || lowerMsg.includes('孩子')) {
    return {
      role: 'assistant',
      content: '👨‍👩‍👧‍👦 亲子游推荐：\n\n• **上海**：迪士尼、海昌海洋公园、自然博物馆\n• **广州/珠海**：长隆野生动物世界、长隆海洋王国\n• **北京**：故宫、科技馆、环球影城\n• **三亚**：亚特兰蒂斯、蜈支洲岛、亲子酒店\n• **云南**：大理游学、丽江古镇、西双版纳野象谷\n\n亲子游建议：行程不要太满，选择有儿童设施的酒店，预留休息时间。需要具体行程规划吗？',
    };
  }

  if (lowerMsg.includes('honeymoon') || lowerMsg.includes('蜜月') || lowerMsg.includes('情侣')) {
    return {
      role: 'assistant',
      content: '💕 蜜月/情侣游推荐：\n\n• **海岛浪漫**：马尔代夫、巴厘岛、普吉岛、斐济\n• **欧洲风情**：巴黎、威尼斯、圣托里尼、瑞士\n• **国内精选**：丽江、大理、厦门、三亚、桂林\n• **小众秘境**：泸沽湖、稻城亚丁、婺源、乌镇\n\n蜜月小贴士：\n✓ 至少提前3个月规划\n✓ 选择私密性好的酒店\n✓ 预留1-2天自由活动\n\n想要 romantic 的行程安排吗？',
    };
  }

  // Generic response
  const genericResponses = [
    '这是个好问题！🤔 旅行中最重要的是根据自己的兴趣和预算来选择目的地。你是更喜欢自然风光还是人文古迹呢？',
    '很高兴为你解答！✨ 如果你有更具体的需求，比如出行人数、天数、预算范围，我可以给你更精准的建议。',
    '了解了！🌟 旅行规划确实需要考虑很多因素。我的建议是先确定大方向（想去看什么类型的风景），然后再细化行程。',
    '不错的问题！💡 这方面我有很多经验可以分享。你可以继续追问，或者告诉我你的旅行计划，我来帮你完善！',
  ];

  return {
    role: 'assistant',
    content: genericResponses[Math.floor(Math.random() * genericResponses.length)],
  };
};

/**
 * Call Anthropic Claude API
 */
const callAnthropicAPI = async (messages) => {
  if (!AI_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const client = new Anthropic({
    apiKey: AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  return {
    role: 'assistant',
    content: response.content[0].text,
  };
};

/**
 * Call OpenAI API
 */
const callOpenAIAPI = async (messages) => {
  if (!AI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await axios.post(
    AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    {
      model: AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    },
    {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    role: 'assistant',
    content: response.data.choices[0].message.content,
  };
};

/**
 * Call custom AI API
 */
const callCustomAPI = async (messages) => {
  if (!AI_API_URL) {
    throw new Error('Custom AI API URL not configured');
  }

  const response = await axios.post(
    AI_API_URL,
    {
      messages,
      system: SYSTEM_PROMPT,
      model: AI_MODEL,
    },
    {
      headers: AI_API_KEY ? { 'Authorization': `Bearer ${AI_API_KEY}` } : {},
    }
  );

  return response.data;
};

/**
 * Main AI chat function
 * @param {Array} messages - Array of message objects {role, content}
 * @returns {Promise<{role: string, content: string}>}
 */
export const chatWithAI = async (messages) => {
  try {
    switch (AI_PROVIDER) {
      case AI_PROVIDERS.ANTHROPIC:
        return await callAnthropicAPI(messages);
      case AI_PROVIDERS.OPENAI:
        return await callOpenAIAPI(messages);
      case AI_PROVIDERS.CUSTOM:
        return await callCustomAPI(messages);
      case AI_PROVIDERS.MOCK:
      default:
        return await getMockAIResponse(messages);
    }
  } catch (error) {
    console.error('AI Chat Error:', error);
    return {
      role: 'assistant',
      content: '抱歉，AI服务暂时不可用。' + (AI_PROVIDER === AI_PROVIDERS.MOCK
        ? '请稍后重试。'
        : '请检查API配置是否正确。'),
      isError: true,
    };
  }
};

/**
 * Get AI provider display name
 */
export const getAIProviderName = () => {
  switch (AI_PROVIDER) {
    case AI_PROVIDERS.ANTHROPIC:
      return 'Claude AI';
    case AI_PROVIDERS.OPENAI:
      return 'ChatGPT';
    case AI_PROVIDERS.CUSTOM:
      return 'AI助手';
    default:
      return 'AI咨询';
  }
};

/**
 * Check if AI is properly configured
 */
export const isAIConfigured = () => {
  if (AI_PROVIDER === AI_PROVIDERS.MOCK) return true;
  if (AI_PROVIDER === AI_PROVIDERS.CUSTOM) return !!AI_API_URL;
  return !!AI_API_KEY;
};
