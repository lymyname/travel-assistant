import React, { useEffect, useRef, useState } from 'react';
import useDialogStore from './stores/useDialogStore';
import ChatMessage from './components/ChatMessage';
import QuickOptions from './components/QuickOptions';
import ParamsPanel from './components/ParamsPanel';
import './App.css';

function App() {
  const { messages, sendMessage, isFetching, addMessage } = useDialogStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('assistant', '嘿！我是你的旅行规划助手 ✨ 告诉我你的旅行想法，我来帮你安排得妥妥的～');
    }
  }, []);
  
  const handleSend = () => {
    if (!inputValue.trim() || isFetching) return;
    sendMessage(inputValue);
    setInputValue('');
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="assistant-info">
          <div className="avatar">✈️</div>
          <div className="assistant-text">
            <h3>旅行规划助手</h3>
            <p>在线 · 随时为你规划行程</p>
          </div>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isFetching && (
          <div className="message-ai">
            <div className="ai-icon">🤖</div>
            <div className="bubble-ai">思考中...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ParamsPanel />
      
      <div className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="输入你的问题..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isFetching}
          />
          <button className="send-btn" onClick={handleSend} disabled={isFetching}>
            ➤
          </button>
        </div>
        <QuickOptions />
      </div>
    </div>
  );
}

export default App;