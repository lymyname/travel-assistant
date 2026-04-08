import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

// AI Provider types
export const AI_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  /** Kimi（月之暗面 Moonshot，OpenAI 兼容） */
  KIMI: 'kimi',
  /** Ada（OpenAI 兼容 Chat Completions，网关地址见 VITE_ADA_API_URL / ADA_API_BASE） */
  ADA: 'ada',
  /** 豆包等模型：火山引擎方舟 OpenAI 兼容接口 */
  DOUBAO: 'doubao',
  CUSTOM: 'custom',
  MOCK: 'mock',
};

// Get AI provider from environment
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || AI_PROVIDERS.MOCK;
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;
const AI_API_URL = import.meta.env.VITE_AI_API_URL;
/** Ada 完整 Chat Completions URL（直连时用，与 Vite 代理二选一） */
const ADA_API_URL = import.meta.env.VITE_ADA_API_URL;
/** 豆包必须显式填方舟接入点 ID；Kimi 默认 moonshot-v1-8k；Ada 默认 ada；其余默认 Claude */
const AI_MODEL =
  import.meta.env.VITE_AI_MODEL ||
  (AI_PROVIDER === AI_PROVIDERS.DOUBAO
    ? ''
    : AI_PROVIDER === AI_PROVIDERS.KIMI
      ? 'moonshot-v1-8k'
      : AI_PROVIDER === AI_PROVIDERS.ADA
        ? 'ada'
        : 'claude-3-haiku-20240307');

/** 开发时通过 Vite 代理请求，密钥只放在服务端可见的 AI_API_KEY */
const USE_AI_PROXY = import.meta.env.VITE_AI_USE_PROXY === 'true';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
/** Moonshot / Kimi（与 OpenAI Chat Completions 一致） */
const KIMI_CHAT_URL = 'https://api.moonshot.cn/v1/chat/completions';
/** 火山方舟（豆包等）OpenAI 兼容 Chat Completions */
const DOUBAO_CHAT_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// System prompt for travel assistant
const SYSTEM_PROMPT = `你是专业的旅行规划助手，具有丰富的旅游知识。你可以：
1. 回答关于目的地、景点、美食、住宿的问题
2. 提供旅行建议、行程规划、注意事项
3. 推荐当地特色体验和隐藏景点
4. 解答签证、交通、天气等实用信息

请用友好、专业的方式回答，适当使用 emoji 增加亲和力；回答尽量简洁清楚，篇幅不必过长。如果用户询问具体产品价格，建议他们使用主界面的旅行规划功能。`;

const toChatMessages = (messages) =>
  messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map(({ role, content }) => ({ role, content }));

/**
 * OpenAI 兼容 Chat Completions（OpenAI / 火山方舟等）
 */
const postOpenAICompatibleChat = async (apiUrl, headers, messages, model) => {
  const response = await axios.post(
    apiUrl,
    {
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...toChatMessages(messages)],
      temperature: 0.7,
      max_tokens: 512,
    },
    { headers }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text) {
    throw new Error('Invalid AI response shape');
  }
  return {
    role: 'assistant',
    content: text,
  };
};

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

  return postOpenAICompatibleChat(
    AI_API_URL || OPENAI_CHAT_URL,
    {
      Authorization: `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    messages,
    AI_MODEL || 'gpt-3.5-turbo'
  );
};

/**
 * Kimi（Moonshot 月之暗面）— OpenAI 兼容接口
 * 在 https://platform.moonshot.cn 创建 API Key；可选模型如 moonshot-v1-8k / moonshot-v1-32k / kimi-k2 等
 * 浏览器直连常被 CORS 拦截，开发环境可设 VITE_AI_USE_PROXY=true + .env 中 MOONSHOT_API_KEY 或 AI_API_KEY
 */
const callKimiAPI = async (messages) => {
  const url = USE_AI_PROXY
    ? '/api/kimi-proxy/chat'
    : (AI_API_URL || KIMI_CHAT_URL);

  const headers = USE_AI_PROXY
    ? { 'Content-Type': 'application/json' }
    : {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      };

  if (!USE_AI_PROXY && !AI_API_KEY) {
    throw new Error(
      'Kimi (Moonshot) API key not configured (set VITE_AI_API_KEY or VITE_AI_USE_PROXY with MOONSHOT_API_KEY / AI_API_KEY in .env)'
    );
  }

  return postOpenAICompatibleChat(url, headers, messages, AI_MODEL || 'moonshot-v1-8k');
};

/**
 * Ada — Anthropic Messages API 格式（非 OpenAI 兼容）
 * 支持流式输出，通过 onChunk 回调逐字返回内容
 * 开发代理：VITE_AI_USE_PROXY=true，在 .env 中配置 ADA_API_BASE 与 ADA_API_KEY（ada_ 开头）
 */
const callAdaAPI = async (messages, options = {}) => {
  const { onChunk, signal } = options;
  const url = USE_AI_PROXY
    ? '/api/ada-proxy/chat'
    : (ADA_API_URL || 'http://ada-cli-golang.ctripcorp.com/v1/messages');

  const apiKey = USE_AI_PROXY ? null : AI_API_KEY;

  if (!USE_AI_PROXY && !apiKey) {
    throw new Error(
      'Ada API key not configured (set VITE_AI_API_KEY or use VITE_AI_USE_PROXY with ADA_API_KEY in .env)'
    );
  }

  const isStreaming = typeof onChunk === 'function';

  // Anthropic Messages API 格式
  const requestBody = {
    model: AI_MODEL || 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: toChatMessages(messages),
  };

  if (isStreaming) {
    requestBody.stream = true;
  }

  // 如果使用流式，使用 fetch API
  if (isStreaming) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey }),
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              fullContent += event.delta.text;
              onChunk(event.delta.text, fullContent);
            } else if (event.type === 'text_delta' && event.delta?.text) {
              fullContent += event.delta.text;
              onChunk(event.delta.text, fullContent);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return { role: 'assistant', content: fullContent };
  }

  // 非流式，使用 axios
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['x-api-key'] = apiKey;
  }

  const response = await axios.post(url, requestBody, { headers });

  // 处理 Anthropic Messages API 响应格式
  const content = response.data?.content;
  if (Array.isArray(content) && content.length > 0) {
    // 优先找 text 类型
    const textItem = content.find(item => item.type === 'text');
    if (textItem && textItem.text) {
      return { role: 'assistant', content: textItem.text };
    }
    // 如果没有 text，尝试找 thinking 类型作为 fallback
    const thinkingItem = content.find(item => item.type === 'thinking');
    if (thinkingItem && thinkingItem.thinking) {
      return { role: 'assistant', content: thinkingItem.thinking };
    }
  }

  throw new Error('Invalid AI response shape');
};

/**
 * 豆包（火山引擎方舟）— 与 OpenAI Chat Completions 请求格式一致
 * 需在控制台创建推理接入点，模型名填接入点 ID（如 ep-xxxx）
 */
const callDoubaoAPI = async (messages) => {
  const url = USE_AI_PROXY
    ? '/api/ai-proxy/chat'
    : (AI_API_URL || DOUBAO_CHAT_URL);

  const headers = USE_AI_PROXY
    ? { 'Content-Type': 'application/json' }
    : {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      };

  if (!USE_AI_PROXY && !AI_API_KEY) {
    throw new Error('Doubao / Ark API key not configured (set VITE_AI_API_KEY or use VITE_AI_USE_PROXY with AI_API_KEY in .env)');
  }

  const model = AI_MODEL;
  if (!model) {
    throw new Error('请设置 VITE_AI_MODEL 为火山方舟推理接入点 ID（如 ep-xxxx）');
  }

  return postOpenAICompatibleChat(url, headers, messages, model);
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
 * @param {Object} options - Optional configuration (e.g., onChunk for streaming)
 * @returns {Promise<{role: string, content: string}>}
 */
export const chatWithAI = async (messages, options = {}) => {
  try {
    switch (AI_PROVIDER) {
      case AI_PROVIDERS.ANTHROPIC:
        return await callAnthropicAPI(toChatMessages(messages));
      case AI_PROVIDERS.OPENAI:
        return await callOpenAIAPI(messages);
      case AI_PROVIDERS.KIMI:
        return await callKimiAPI(messages);
      case AI_PROVIDERS.ADA:
        return await callAdaAPI(messages, options);
      case AI_PROVIDERS.DOUBAO:
        return await callDoubaoAPI(messages);
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
    case AI_PROVIDERS.KIMI:
      return 'Kimi · 旅行助手';
    case AI_PROVIDERS.ADA:
      return 'Ada · 旅行助手';
    case AI_PROVIDERS.DOUBAO:
      return '豆包 · 旅行助手';
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
  if (AI_PROVIDER === AI_PROVIDERS.DOUBAO || AI_PROVIDER === AI_PROVIDERS.KIMI || AI_PROVIDER === AI_PROVIDERS.ADA) {
    return USE_AI_PROXY || !!AI_API_KEY;
  }
  return !!AI_API_KEY;
};
