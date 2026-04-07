import { memo, useState, useCallback } from 'react';
import useDialogStore from '../stores/useDialogStore';
import { PARAM_LABELS } from '../constants';
import './MobileParamsDrawer.css';

const MobileParamsDrawer = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { collectedParams } = useDialogStore();

  const entries = Object.entries(collectedParams).filter(
    ([key, val]) => val && PARAM_LABELS[key]
  );

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Don't show if no params collected
  if (entries.length === 0) return null;

  return (
    <div className="mobile-params-drawer-wrapper">
      {/* Toggle button */}
      <button
        className="mobile-params-toggle"
        onClick={toggleDrawer}
        aria-expanded={isOpen}
        aria-controls="mobile-params-panel"
        aria-label="查看已收集参数"
      >
        <span className="param-count">{entries.length}</span>
        <span className="param-label">参数</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="mobile-params-overlay"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        id="mobile-params-panel"
        className={`mobile-params-panel ${isOpen ? 'open' : ''}`}
        aria-label="已收集参数"
        role="dialog"
        aria-modal="true"
      >
        <div className="mobile-params-header">
          <h4>已收集参数</h4>
          <button
            className="close-drawer-btn"
            onClick={closeDrawer}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <div className="mobile-params-content">
          {entries.map(([key, val]) => (
            <div key={key} className="mobile-param-item">
              <span className="param-dot" aria-hidden="true" />
              <span className="param-name">{PARAM_LABELS[key]}</span>
              <span className="param-value">{val}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
});

MobileParamsDrawer.displayName = 'MobileParamsDrawer';

export default MobileParamsDrawer;
