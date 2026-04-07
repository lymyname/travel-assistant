import { memo } from 'react';
import useDialogStore from '../stores/useDialogStore';
import { PARAM_LABELS } from '../constants';

const ParamsPanel = memo(() => {
  const { collectedParams } = useDialogStore();
  const entries = Object.entries(collectedParams).filter(
    ([key, val]) => val && PARAM_LABELS[key]
  );

  if (entries.length === 0) return null;

  return (
    <aside className="params-panel" aria-label="已收集参数">
      <h4>已收集参数</h4>
      {entries.map(([key, val]) => (
        <div key={key} className="param-item">
          <span className="param-dot" aria-hidden="true" />
          <span>{PARAM_LABELS[key]}: {val}</span>
        </div>
      ))}
    </aside>
  );
});

ParamsPanel.displayName = 'ParamsPanel';

export default ParamsPanel;