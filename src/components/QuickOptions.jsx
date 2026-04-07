import { memo, useCallback } from 'react';
import useDialogStore from '../stores/useDialogStore';
import { QUICK_OPTIONS } from '../constants';

const QuickOptions = memo(() => {
  const { sendMessage } = useDialogStore();

  const handleClick = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  return (
    <nav className="quick-options" aria-label="快捷选项">
      {QUICK_OPTIONS.map((opt, idx) => (
        <button
          key={idx}
          className="quick-btn"
          onClick={() => handleClick(opt.text)}
          aria-label={`选择${opt.label}`}
        >
          {opt.label}
        </button>
      ))}
    </nav>
  );
});

QuickOptions.displayName = 'QuickOptions';

export default QuickOptions;