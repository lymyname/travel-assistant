import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatWithAI, getAIProviderName } from '../services/aiService.js';
import './EmbeddedAIAssistant.css';

// 嵌入式AI助手组件 - 直接展示在页面中
const EmbeddedAIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const providerName = getAIProviderName();

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || isStreaming) return;

    const userMessage = { role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setStreamingContent('');

    abortControllerRef.current = new AbortController();

    try {
      const aiResponse = await chatWithAI([...messages, userMessage], {
        onChunk: (chunk, fullContent) => {
          setStreamingContent(fullContent);
        },
        signal: abortControllerRef.current.signal,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: streamingContent || '抱歉，服务暂时不可用，请稍后重试。',
          isError: true,
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [inputValue, isLoading, isStreaming, messages, streamingContent]);

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

  const handleSuggestionClick = useCallback(async (text) => {
    if (isLoading || isStreaming) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    abortControllerRef.current = new AbortController();

    try {
      const aiResponse = await chatWithAI([...messages, userMessage], {
        onChunk: (chunk, fullContent) => {
          setStreamingContent(fullContent);
        },
        signal: abortControllerRef.current.signal,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: streamingContent || '抱歉，服务暂时不可用，请稍后重试。',
          isError: true,
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [isLoading, isStreaming, messages, streamingContent]);

  return (
    <section className="embedded-ai-section" aria-label="AI问问">
      <header className="embedded-ai-header">
        <div className="embedded-ai-title">
          <span className="embedded-ai-avatar">🤖</span>
          <div>
            <h3>{providerName}</h3>
            <span className="embedded-ai-status">
              {(isLoading || isStreaming) ? '思考中...' : '在线 · 随时解答旅行问题'}
            </span>
          </div>
        </div>
        <div className="embedded-ai-actions">
          <button className="embedded-ai-action-btn" onClick={handleClear} title="清空对话">🗑️</button>
        </div>
      </header>

      <div className="embedded-ai-messages">
        {messages.length === 0 && (
          <div className="embedded-ai-welcome">
            <div className="embedded-ai-welcome-icon">👋</div>
            <h4>你好！我是AI旅行助手</h4>
            <p>有什么旅行相关的问题都可以问我：</p>
            <ul className="embedded-ai-suggestions">
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
          <div key={index} className={`embedded-ai-message ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <div className="embedded-ai-message-avatar">{msg.role === 'assistant' ? '🤖' : '👤'}</div>
            <div className="embedded-ai-message-content">
              {msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              <time className="embedded-ai-message-time">{formatTime(msg.timestamp)}</time>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div className="embedded-ai-message assistant streaming">
            <div className="embedded-ai-message-avatar">
              <span className="thinking-brain">🧠</span>
            </div>
            <div className="embedded-ai-message-content">
              <div className="markdown-body streaming-text">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
                <span className="typing-cursor">▋</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {(isLoading && !isStreaming) && (
          <div className="embedded-ai-message assistant loading">
            <div className="embedded-ai-message-avatar ai-thinking">
              <span className="brain">🧠</span>
              <span className="sparkle s1">✨</span>
              <span className="sparkle s2">💫</span>
              <span className="sparkle s3">⭐</span>
            </div>
            <div className="embedded-ai-message-content">
              <div className="ai-thinking-bubble">
                <span className="thinking-text">正在思考</span>
                <span className="thinking-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
              <div className="travel-icons">
                <span className="t-icon">✈️</span>
                <span className="t-icon">🗺️</span>
                <span className="t-icon">🏝️</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="embedded-ai-input-area">
        <div className="embedded-ai-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder={isStreaming ? "AI正在回答..." : "输入你的问题..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isStreaming}
            maxLength={500}
            aria-label="输入问题"
          />
          {isStreaming ? (
            <button
              className="embedded-ai-stop-btn"
              onClick={() => abortControllerRef.current?.abort()}
              aria-label="停止生成"
            >
              ⏹
            </button>
          ) : (
            <button className="embedded-ai-send-btn" onClick={handleSend} disabled={isLoading || !inputValue.trim()} aria-label="发送">
              ➤
            </button>
          )}
        </div>
        <p className="embedded-ai-input-hint">按 Enter 发送，AI回答仅供参考</p>
      </footer>
    </section>
  );
};

export default EmbeddedAIAssistant;
