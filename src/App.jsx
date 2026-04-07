import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash-es';
import useDialogStore from './stores/useDialogStore';
import ChatMessage from './components/ChatMessage';
import QuickOptions from './components/QuickOptions';
import ParamsPanel from './components/ParamsPanel';
import MobileParamsDrawer from './components/MobileParamsDrawer';
import { ThinkingIndicator } from './components/Skeleton';
import { DEFAULT_WELCOME_MESSAGE } from './constants';
import './App.css';

// Debounced scroll function
const debouncedScroll = debounce((element) => {
  element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
}, 100);

function App() {
  const { messages, sendMessage, isFetching, addMessage, clearChat } = useDialogStore();
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    debouncedScroll(messagesEndRef.current);
  }, [messages]);

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('assistant', DEFAULT_WELCOME_MESSAGE);
    }
  }, []);

  // Debounced send function to prevent double submission
  const debouncedSend = useMemo(
    () =>
      debounce((text) => {
        sendMessage(text);
      }, 200, { leading: true, trailing: false }),
    [sendMessage]
  );

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isFetching) return;
    debouncedSend(trimmed);
    setInputValue('');
  }, [inputValue, isFetching, debouncedSend]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleClearChat = useCallback(() => {
    if (confirm('确定要清空对话吗？')) {
      clearChat();
    }
  }, [clearChat]);

  return (
    <main className="chat-container" role="main" aria-label="旅行规划助手">
      <header className="chat-header">
        <div className="assistant-info">
          <div className="avatar" aria-hidden="true">✈️</div>
          <div className="assistant-text">
            <h1 className="app-title">旅行规划助手</h1>
            <p className="app-status" aria-live="polite">
              {isFetching ? '思考中...' : '在线 · 随时为你规划行程'}
            </p>
          </div>
          <button
            className="clear-btn"
            onClick={handleClearChat}
            aria-label="清空对话"
            title="清空对话"
          >
            🗑️
          </button>
        </div>
      </header>

      <section
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="对话消息"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isFetching && <ThinkingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </section>

      <ParamsPanel />
      <MobileParamsDrawer />

      <footer className="chat-input-area">
        <form
          className="input-wrapper"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          aria-label="消息输入"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="输入你的问题..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            disabled={isFetching}
            aria-label="输入消息"
            aria-busy={isFetching}
            className={isInputFocused ? 'focused' : ''}
            autoComplete="off"
            maxLength={500}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={isFetching || !inputValue.trim()}
            aria-label="发送消息"
            aria-disabled={isFetching || !inputValue.trim()}
          >
            ➤
          </button>
        </form>
        <QuickOptions />
      </footer>
    </main>
  );
}

export default App;