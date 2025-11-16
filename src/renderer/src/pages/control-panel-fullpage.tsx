/**
 * 控制面板全屏页面
 * 用于扫码访问，直接显示控制面板（不需要快捷键呼出）
 */

import React from 'react';
import ControlPanel from './control-panel';

const ControlPanelFullPage: React.FC = () => {
  // 全屏显示控制面板，isOpen=true，不可关闭（扫码访问场景）
  return (
    <ControlPanel 
      isOpen={true} 
      onClose={() => {
        // 扫码访问时，关闭=返回上一页或关闭标签页
        window.history.back();
      }} 
      useViewportBounds={true}  // 使用完整视口
    />
  );
};

export default ControlPanelFullPage;

