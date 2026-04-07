import { memo } from 'react';
import PropTypes from 'prop-types';
import ProductCard from './ProductCard';

/**
 * Format timestamp to readable time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * @typedef {Object} Message
 * @property {string|number} id
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {string} [timestamp]
 * @property {Array} [products]
 * @property {boolean} [isError]
 * @property {function} [onRetry]
 */

/**
 * @param {{ message: Message }} props
 */
const ChatMessage = memo(({ message }) => {
  const isUser = message.role === 'user';

  return (
    <article
      className={`message-${isUser ? 'user' : 'ai'}`}
      aria-label={`${isUser ? '用户' : '助手'}消息`}
    >
      {!isUser && <div className="ai-icon" aria-hidden="true">🤖</div>}
      <div className={`bubble-${isUser ? 'user' : 'ai'}`}>
        <p className="message-content">{message.content}</p>
        {message.isError && message.onRetry && (
          <button
            className="retry-btn"
            onClick={message.onRetry}
            aria-label="重试发送"
          >
            ↻ 重试
          </button>
        )}
        {message.products && message.products.length > 0 && (
          <section
            className="products-section"
            aria-label="推荐产品列表"
          >
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
        <time className="message-time" dateTime={message.timestamp}>
          {formatTime(message.timestamp)}
        </time>
      </div>
    </article>
  );
});

ChatMessage.displayName = 'ChatMessage';

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
    products: PropTypes.array,
    isError: PropTypes.bool,
    onRetry: PropTypes.func,
  }).isRequired,
};

export default ChatMessage;