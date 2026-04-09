import './Skeleton.css';

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-img" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text short" />
    <div className="skeleton skeleton-footer" />
  </div>
);

export const SkeletonMessage = () => (
  <div className="skeleton-message">
    <div className="skeleton skeleton-avatar" />
    <div className="skeleton-bubble">
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
    </div>
  </div>
);

export const ThinkingIndicator = ({ isAI = false }) => (
  <div className="message-ai" role="status" aria-live="polite">
    <div className="ai-icon thinking-pulse">{isAI ? '🧠' : '🤖'}</div>
    <div className="bubble-ai thinking-bubble-enhanced" aria-label={isAI ? 'AI正在思考' : '正在搜索产品'}>
      <div className="wave-container">
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
      </div>
      <span className="thinking-text">{isAI ? '思考中' : '搜索中'}</span>
    </div>
  </div>
);
