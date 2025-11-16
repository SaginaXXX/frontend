import { useState } from 'react';

export interface UseControlPanelReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * 管理控制面板的打开/关闭状态
 */
export function useControlPanel(): UseControlPanelReturn {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

