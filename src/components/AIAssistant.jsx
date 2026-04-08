import { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithAI, getAIProviderName } from '../services/aiService.js';
import { ThinkingIndicator } from './Skeleton.jsx';
import './AIAssistant.css';

// Default button position (right: 20px, bottom: 160px)
const DEFAULT_RIGHT = 20;
const DEFAULT_BOTTOM = 160;
const BUTTON_WIDTH = 72;
const BUTTON_HEIGHT = 64;
const EDGE_PADDING = 10;

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Position state - start with safe defaults
  const [position, setPosition] = useState({
    right: DEFAULT_RIGHT,
    bottom: DEFAULT_BOTTOM,
  });

  // Update position on mount
  useEffect(() => {
    setPosition({
      right: DEFAULT_RIGHT,
      bottom: DEFAULT_BOTTOM,
    });
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const providerName = getAIProviderName();

  // Clear old localStorage on mount
  useEffect(() => {
    localStorage.removeItem('ai-assistant-position');
  }, []);

  // Handle window resize - keep button in viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxRight = window.innerWidth - BUTTON_WIDTH - EDGE_PADDING;
        const maxBottom = window.innerHeight - BUTTON_HEIGHT - EDGE_PADDING;
        return {
          right: Math.max(EDGE_PADDING, Math.min(maxRight, prev.right)),
          bottom: Math.max(EDGE_PADDING, Math.min(maxBottom, prev.bottom)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse/Touch handlers
  const handleStart = useCallback((clientX, clientY) => {
    if (isOpen) return;
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    setHasDragged(false);
    setIsDragging(true);
  }, [isOpen]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  useEffect(() => {
    if (!isDragging) return;

    let lastX = dragRef.current.startX;
    let lastY = dragRef.current.startY;

    const handleMove = (clientX, clientY) => {
      // Calculate movement delta
      const deltaX = clientX - lastX; // positive when moving right
      const deltaY = lastY - clientY; // positive when moving up

      // Check if actually dragged
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setHasDragged(true);
      }

      // Update position based on current position
      setPosition(prev => {
        // deltaX > 0 (moving right) => right value should decrease
        // deltaX < 0 (moving left) => right value should increase
        let newRight = prev.right - deltaX;
        let newBottom = prev.bottom + deltaY;

        // Constrain to viewport
        const minRight = EDGE_PADDING;
        const maxRight = window.innerWidth - BUTTON_WIDTH - EDGE_PADDING;
        const minBottom = EDGE_PADDING;
        const maxBottom = window.innerHeight - BUTTON_HEIGHT - EDGE_PADDING;

        newRight = Math.max(minRight, Math.min(maxRight, newRight));
        newBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));

        return { right: newRight, bottom: newBottom };
      });

      // Update last position
      lastX = clientX;
      lastY = clientY;
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleClick = useCallback((e) => {
    if (hasDragged) {
      e.stopPropagation();
      return;
    }
    setIsOpen(prev => !prev);
  }, [hasDragged]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await chatWithAI([...messages, userMessage]);
      setMessages(prev => [...prev, { ...aiResponse, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后重试。',
        isError: true,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClear = useCallback(() => {
    if (confirm('确定要清空AI对话记录吗？')) {
      setMessages([]);
    }
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const suggestions = [
    { icon: '📍', text: '目的地推荐和攻略' },
    { icon: '🍜', text: '当地美食和餐厅' },
    { icon: '🛂', text: '签证和入境政策' },
    { icon: '🌤️', text: '最佳旅行时间' },
    { icon: '💰', text: '预算规划建议' },
    { icon: '👨‍👩‍👧‍👦', text: '亲子游/蜜月游推荐' },
  ];

  const handleSuggestionClick = useCallback((text) => {
    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    chatWithAI([...messages, userMessage])
      .then(aiResponse => {
        setMessages(prev => [...prev, { ...aiResponse, timestamp: new Date().toISOString() }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，服务暂时不可用，请稍后重试。',
          isError: true,
          timestamp: new Date().toISOString(),
        }]);
      })
      .finally(() => setIsLoading(false));
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        className={`ai-assistant-float-btn ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          right: `${position.right}px`,
          bottom: `${position.bottom}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        aria-label="打开AI助手"
        aria-expanded={isOpen}
      >
        <span className="ai-icon">🤖</span>
        <span className="ai-label">AI问问</span>
      </button>

      {/* Overlay */}
      {isOpen && <div className="ai-assistant-overlay" onClick={() => setIsOpen(false)} />}

      {/* Drawer */}
      <aside className={`ai-assistant-drawer ${isOpen ? 'open' : ''}`}>
        <header className="ai-assistant-header">
          <div className="ai-assistant-title">
            <span className="ai-avatar">🤖</span>
            <div>
              <h3>{providerName}</h3>
              <span className="ai-status">在线 · 随时解答旅行问题</span>
            </div>
          </div>
          <div className="ai-assistant-actions">
            <button className="ai-action-btn" onClick={handleClear} title="清空对话">🗑️</button>
            <button className="ai-action-btn close" onClick={() => setIsOpen(false)} title="关闭">✕</button>
          </div>
        </header>

        <div className="ai-messages">
          {messages.length === 0 && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">👋</div>
              <h4>你好！我是AI旅行助手</h4>
              <p>有什么旅行相关的问题都可以问我：</p>
              <ul className="ai-suggestions">
                {suggestions.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(item.text)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSuggestionClick(item.text);
                      }
                    }}
                  >
                    {item.icon} {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`ai-message ${msg.role} ${msg.isError ? 'error' : ''}`}>
              <div className="ai-message-avatar">{msg.role === 'assistant' ? '🤖' : '👤'}</div>
              <div className="ai-message-content">
                <p>{msg.content}</p>
                <time className="ai-message-time">{formatTime(msg.timestamp)}</time>
              </div>
            </div>
          ))}

          {isLoading && <ThinkingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <footer className="ai-input-area">
          <div className="ai-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              placeholder="输入你的问题..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={500}
              aria-label="输入问题"
            />
            <button className="ai-send-btn" onClick={handleSend} disabled={isLoading || !inputValue.trim()} aria-label="发送">
              ➤
            </button>
          </div>
          <p className="ai-input-hint">按 Enter 发送，AI回答仅供参考</p>
        </footer>
      </aside>
    </>
  );
};

export default AIAssistant;
