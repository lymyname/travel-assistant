import React from 'react';
import useDialogStore from '../stores/useDialogStore';

const QuickOptions = () => {
  const { sendMessage } = useDialogStore();
  const options = [
    { label: '🏔️ 云南', text: '去云南' },
    { label: '🏖️ 三亚', text: '去三亚' },
    { label: '🏯 北京', text: '去北京' },
    { label: '📅 3天', text: '3天' },
    { label: '📅 5天', text: '5天' },
    { label: '📅 7天', text: '7天' },
    { label: '👥 1人', text: '1个人' },
    { label: '👥 2人', text: '2个人' },
    { label: '👥 家庭', text: '4个人' },
    { label: '💰 经济', text: '预算经济' },
    { label: '💰 中等', text: '预算中等' },
    { label: '💰 豪华', text: '预算豪华' },
  ];
  
  return (
    <div className="quick-options">
      {options.map((opt, idx) => (
        <button key={idx} className="quick-btn" onClick={() => sendMessage(opt.text)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default QuickOptions;