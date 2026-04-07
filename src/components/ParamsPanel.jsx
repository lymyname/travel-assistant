import React from 'react';
import useDialogStore from '../stores/useDialogStore';

const ParamsPanel = () => {
  const { collectedParams } = useDialogStore();
  const paramLabels = {
    destination: '目的地',
    days: '天数',
    travelers: '人数',
    budget: '预算',
    departure: '出发地',
  };
  const entries = Object.entries(collectedParams).filter(([key, val]) => val && paramLabels[key]);
  if (entries.length === 0) return null;
  return (
    <div className="params-panel">
      <h4>已收集参数</h4>
      {entries.map(([key, val]) => (
        <div key={key} className="param-item">
          <span className="param-dot"></span> {paramLabels[key]}: {val}
        </div>
      ))}
    </div>
  );
};

export default ParamsPanel;