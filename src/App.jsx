import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash-es';
import html2canvas from 'html2canvas';
import useDialogStore from './stores/useDialogStore';
import ChatMessage from './components/ChatMessage';
import QuickOptions from './components/QuickOptions';
import ParamsPanel from './components/ParamsPanel';
import MobileParamsDrawer from './components/MobileParamsDrawer';
import { ThinkingIndicator } from './components/Skeleton';
import { getWelcomeMessage } from './services/api.js';
import './App.css';

// Debounced scroll function
const debouncedScroll = debounce((element) => {
  element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
}, 100);

function App() {
  const { messages, sendMessage, isFetching, isAIResponding, addMessage, clearChat, stopGenerating } = useDialogStore();
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const isSubmittingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    debouncedScroll(messagesEndRef.current);
  }, [messages]);

  // Initialize welcome message - use ref to prevent double initialization in StrictMode
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      const welcomeMsg = getWelcomeMessage();
      addMessage('assistant', welcomeMsg);
    }
  }, []);

  const debouncedSend = useMemo(
    () =>
      debounce((text) => {
        sendMessage(text);
      }, 300, { leading: false, trailing: true }),
    [sendMessage]
  );

  const handleSend = useCallback(() => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const trimmed = inputValue.trim();
    if ((!trimmed && uploadedImages.length === 0) || isFetching || isAIResponding) {
      isSubmittingRef.current = false;
      return;
    }

    if (uploadedImages.length > 0) {
      sendMessage(trimmed || '请帮我看看这张图片', { images: uploadedImages });
      setUploadedImages([]);
      setInputValue('');
    } else {
      debouncedSend(trimmed);
      setInputValue('');
    }

    // Reset lock after a short delay
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);
  }, [inputValue, uploadedImages, isFetching, isAIResponding, debouncedSend, sendMessage, addMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
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
      setUploadedImages([]);
    }
  }, [clearChat]);

  // Screenshot functionality
  const handleScreenshot = useCallback(async () => {
    if (!chatContainerRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(chatContainerRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imageData = canvas.toDataURL('image/png');
      setUploadedImages(prev => [...prev, imageData]);
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('截图失败，请重试');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // Image upload functionality
  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = '';
  }, []);

  const removeUploadedImage = useCallback((index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clipboard paste functionality
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        hasImage = true;
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setUploadedImages(prev => [...prev, event.target.result]);
          };
          reader.readAsDataURL(file);
        }
      }
    }

    // If we captured an image, prevent the default paste behavior
    if (hasImage) {
      e.preventDefault();
    }
  }, []);

  return (
    <main ref={chatContainerRef} className="chat-container" role="main" aria-label="旅行规划助手" onPaste={handlePaste}>
      <header className="chat-header">
        <div className="assistant-info">
          <div className="avatar" aria-hidden="true">✈️</div>
          <div className="assistant-text">
            <h1 className="app-title">旅行规划助手</h1>
            <p className="app-status" aria-live="polite">
              {isAIResponding ? 'AI思考中...' : (isFetching ? '搜索中...' : '在线 · 随时为你规划行程')}
            </p>
          </div>
          <button
            className="screenshot-btn"
            onClick={handleScreenshot}
            disabled={isCapturing}
            aria-label="截图"
            title="截图"
          >
            {isCapturing ? '📸' : '📷'}
          </button>
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
        {/* Show loading only when not streaming (for product search) */}
        {isFetching && (
          <ThinkingIndicator isAI={false} />
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </section>

      <ParamsPanel />
      <MobileParamsDrawer />

      <footer className="chat-input-area">
        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="uploaded-images-preview">
            {uploadedImages.map((img, index) => (
              <div key={index} className="uploaded-image-item">
                <img src={img} alt={`上传图片 ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeUploadedImage(index)}
                  aria-label={`删除图片 ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="input-wrapper"
          onSubmit={(e) => {
            e.preventDefault();
          }}
          aria-label="消息输入"
        >
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isFetching || isAIResponding}
            aria-label="上传图片"
            title="上传图片"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            aria-label="选择图片文件"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={uploadedImages.length > 0 ? '添加描述（可选）...' : '输入你的问题...'}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            disabled={isFetching || isAIResponding}
            aria-label="输入消息"
            aria-busy={isFetching}
            className={isInputFocused ? 'focused' : ''}
            autoComplete="off"
            maxLength={500}
          />
          {isAIResponding ? (
            <button
              type="button"
              className="stop-btn"
              onClick={stopGenerating}
              aria-label="停止生成"
              title="停止生成"
            >
              ◼
            </button>
          ) : (
            <button
              type="submit"
              className="send-btn"
              disabled={isFetching || (!inputValue.trim() && uploadedImages.length === 0)}
              aria-label="发送消息"
              aria-disabled={isFetching || (!inputValue.trim() && uploadedImages.length === 0)}
            >
              ➤
            </button>
          )}
        </form>
        <p className="paste-hint">💡 提示：截图后可直接粘贴到此处发送</p>
        <QuickOptions />
      </footer>

    </main>
  );
}

export default App;