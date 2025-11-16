/**
 * 企业级 Zustand 状态管理架构（重构版）
 * 
 * 架构说明：
 * - 模块化设计：将 ~1000 行代码拆分为多个独立模块
 * - 类型安全：完整的 TypeScript 类型定义
 * - 性能优化：精确的 selector 订阅
 * - 可维护性：每个模块职责单一，易于理解和修改
 * 
 * 目录结构：
 * ├── types.ts - 类型定义
 * ├── config.ts - 配置和工具函数
 * ├── initial-states.ts - 初始状态
 * ├── slices/ - 状态切片
 * │   ├── ai-slice.ts
 * │   ├── vad-slice.ts
 * │   ├── media-slice.ts
 * │   ├── chat-slice.ts
 * │   └── config-slice.ts
 * ├── selectors.ts - 状态选择器 hooks
 * └── index.ts - 主入口（本文件）
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 导入初始状态
import {
  initialAiState,
  initialVADState,
  initialMediaState,
  initialChatState,
  initialConfigState,
  initialProactiveState,
  initialMCPState,
} from './initial-states';

// 导入配置
import { smartMerge } from './config';

// 导入 slices
import { createAiSlice, type AiSlice } from './slices/ai-slice';
import { createVADSlice, type VADSlice } from './slices/vad-slice';
import { createMediaSlice, type MediaSlice } from './slices/media-slice';
import { createChatSlice, type ChatSlice } from './slices/chat-slice';
import { createConfigSlice, type ConfigSlice } from './slices/config-slice';
import { createMCPSlice, type MCPSlice } from './slices/mcp-slice';


// 统一状态接口
export type AppStore = AiSlice & VADSlice & MediaSlice & ChatSlice & ConfigSlice & MCPSlice;


// 创建 Store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get, store) => ({
          // @ts-ignore - Zustand slice composition 类型推断问题
          ...createAiSlice(set, get, store),
          // @ts-ignore - Zustand slice composition 类型推断问题
          ...createVADSlice(set, get, store),
          // @ts-ignore - Zustand slice composition 类型推断问题
          ...createMediaSlice(set, get, store),
          // @ts-ignore - Zustand slice composition 类型推断问题
          ...createChatSlice(set, get, store),
          // @ts-ignore - Zustand slice composition 类型推断问题
          ...createConfigSlice(set, get, store),
          // @ts-ignore - Zustand slice composition 类型推断问题
          ...createMCPSlice(set, get, store),
          
          // 重写 resetAll 方法（在 config-slice 中只能重置部分状态）
          resetAll: () => {
            set((draft) => {
              draft.ai = initialAiState;
              draft.vad = initialVADState;
              draft.media = initialMediaState;
              draft.chat = initialChatState;
              draft.config = initialConfigState;
              draft.proactive = initialProactiveState;
              draft.mcp = initialMCPState;
              draft.backendSynthComplete = false;
            });
          },
        }))
      ),
      {
        name: 'app-store',
        partialize: (state) => ({
          // 只持久化部分状态
          vad: {
            micOn: state.vad.micOn,
            autoStopMic: state.vad.autoStopMic,
            autoStartMicOn: state.vad.autoStartMicOn,
            autoStartMicOnConvEnd: state.vad.autoStartMicOnConvEnd,
            settings: state.vad.settings,
          },
          media: {
            backgroundUrl: state.media.backgroundUrl,
            showAdvertisements: state.media.showAdvertisements,
            live2d: state.media.live2d,
            advertisementAudio: state.media.advertisementAudio,
          },
          config: {
            wsUrl: state.config.wsUrl,
            baseUrl: state.config.baseUrl,
            appConfig: state.config.appConfig,
          },
          // MCP：只持久化位置和尺寸（vpDebug 模式的调整）
          mcp: {
            position: state.mcp.position,
            size: state.mcp.size,
          },
        }),
        merge: smartMerge,
      }
    ),
    {
      name: 'app-store',
    }
  )
);



// 导出所有类型
export * from './types';

// 导出所有选择器
export * from './selectors';

console.log('🏪 Zustand 状态管理系统已初始化');