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

export const ThinkingIndicator = () => (
  <div className="message-ai" role="status" aria-live="polite">
    <div className="ai-icon">🤖</div>
    <div className="bubble-ai thinking-bubble" aria-label="AI正在思考">
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </div>
  </div>
);
