import axios from 'axios';

const request = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 10000 });

export const recommendApi = async (payload) => {
  // Mock 数据（开发阶段）
  await new Promise(resolve => setTimeout(resolve, 800));
  const dest = payload.collectedParams.destination || '云南';
  const days = payload.collectedParams.days || 5;
  return {
    code: 0,
    message: 'success',
    data: {
      reply: `根据您的要求，为您推荐以下${dest}${days}日游产品：`,
      products: [
        { id: 'p1', name: `${dest} · 经典${days}日游`, description: '核心景点全覆盖，舒适酒店', price: 2980, imageUrl: 'https://picsum.photos/300/200?random=1', detailUrl: '/product/p1' },
        { id: 'p2', name: `${dest} · 深度体验${days}日`, description: '特色民宿+小众路线', price: 3580, imageUrl: 'https://picsum.photos/300/200?random=2', detailUrl: '/product/p2' },
      ],
    },
  };
};