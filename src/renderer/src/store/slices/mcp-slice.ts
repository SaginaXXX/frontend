/**
 * MCP Canvas 状态 Slice
 * 管理 MCP 内容展示画布的状态和操作
 */

import { StateCreator } from 'zustand';
import { MCPState, MCPContentType, MCPContentData } from '../types';
import { initialMCPState } from '../initial-states';

export interface MCPSlice {
  mcp: MCPState;
  
  // 显示 MCP 内容
  showMCPContent: (contentType: MCPContentType, contentData: MCPContentData) => void;
  
  // 隐藏 MCP 内容
  hideMCPContent: () => void;
  
  // 更新画布位置
  updateMCPPosition: (x: number, y: number) => void;
  
  // 更新画布尺寸
  updateMCPSize: (width: number, height: number) => void;
  
  // 设置视频播放状态
  setMCPVideoPlaying: (playing: boolean) => void;
}

export const createMCPSlice: StateCreator<
  MCPSlice,
  [['zustand/immer', never]]
> = (set) => ({
  mcp: initialMCPState,

  // =========================
  // 内容显示管理
  // =========================
  showMCPContent: (contentType, contentData) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.mcp) {
        draft.mcp = initialMCPState;
      }
      
      draft.mcp.isVisible = true;
      draft.mcp.contentType = contentType;
      draft.mcp.contentData = contentData;
      draft.mcp.isVideoPlaying = false;
      
      console.log('🎨 MCP Canvas: 显示内容', { contentType, contentData });
    });
  },

  hideMCPContent: () => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.mcp) {
        draft.mcp = initialMCPState;
      }
      
      draft.mcp.isVisible = false;
      draft.mcp.isVideoPlaying = false;
      
      // 延迟清空内容，保持动画效果
      setTimeout(() => {
        set((d) => {
          if (!d.mcp) return;
          d.mcp.contentType = null;
          d.mcp.contentData = null;
        });
      }, 300);
      
      console.log('🎨 MCP Canvas: 隐藏内容');
    });
  },

  // =========================
  // 位置和尺寸管理
  // =========================
  updateMCPPosition: (x, y) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.mcp) {
        draft.mcp = initialMCPState;
      }
      
      draft.mcp.position.x = x;
      draft.mcp.position.y = y;
    });
  },

  updateMCPSize: (width, height) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.mcp) {
        draft.mcp = initialMCPState;
      }
      
      draft.mcp.size.width = width;
      draft.mcp.size.height = height;
    });
  },

  // =========================
  // 视频播放状态
  // =========================
  setMCPVideoPlaying: (playing) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.mcp) {
        draft.mcp = initialMCPState;
      }
      
      draft.mcp.isVideoPlaying = playing;
      
      console.log('🎨 MCP Canvas: 视频播放状态', playing);
    });
  },
});

