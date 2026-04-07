import React from 'react';
import ProductCard from './ProductCard';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`message-${isUser ? 'user' : 'ai'}`}>
      {!isUser && <div className="ai-icon">🤖</div>}
      <div className={`bubble-${isUser ? 'user' : 'ai'}`}>
        {message.content}
        {message.products && message.products.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {message.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;