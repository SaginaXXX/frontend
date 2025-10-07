/* eslint-disable react/jsx-no-constructed-context-values */
import React, { useContext, useCallback, useEffect } from 'react';
import { wsService } from '@/services/websocket-service';
import { useConfigStore } from '@/store';
import { getServerConfig } from '@/utils/env-config';

// 动态获取后端服务地址（优先 127.0.0.1:12393，或由环境变量/自动发现提供）
function getDefaultUrls() {
  const cfg = getServerConfig();
  console.log(`🌐 自动检测服务器地址: ${cfg.baseUrl}`);
  return { baseUrl: cfg.baseUrl, wsUrl: cfg.wsUrl };
}

const defaultUrls = getDefaultUrls();
const DEFAULT_WS_URL = defaultUrls.wsUrl;
const DEFAULT_BASE_URL = defaultUrls.baseUrl;

export interface HistoryInfo {
  uid: string;
  latest_message: {
    role: 'human' | 'ai';
    timestamp: string;
    content: string;
  } | null;
  timestamp: string | null;
}

interface WebSocketContextProps {
  sendMessage: (message: object) => void;
  wsState: string;
  reconnect: () => void;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
}

export const WebSocketContext = React.createContext<WebSocketContextProps>({
  sendMessage: wsService.sendMessage.bind(wsService),
  wsState: 'CLOSED',
  reconnect: () => wsService.connect(DEFAULT_WS_URL),
  wsUrl: DEFAULT_WS_URL,
  setWsUrl: () => {},
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
});

// ✅ 修复：使用箭头函数导出，符合 Fast Refresh 规范
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const defaultWsUrl = DEFAULT_WS_URL;
export const defaultBaseUrl = DEFAULT_BASE_URL;

// ✅ 修复：使用箭头函数导出，符合 Fast Refresh 规范
export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  // ✅ 从 Zustand Store 读取配置（单一数据源）
  const { wsUrl, baseUrl, updateNetworkConfig } = useConfigStore();

  // ✅ 检测并修正旧配置（只在挂载时运行一次）
  useEffect(() => {
    const shouldResetWs = wsUrl && (/:(3000|3001)(?:\b|\/)/.test(wsUrl) || !wsUrl.endsWith('/client-ws'));
    const shouldResetBase = baseUrl && /:(3000|3001)(?:\b|\/)/.test(baseUrl);
    
    if (shouldResetWs || shouldResetBase) {
      const defaultConfig = getServerConfig();
      console.log('🔄 检测到旧配置，重置为默认地址:', defaultConfig);
      updateNetworkConfig({
        wsUrl: shouldResetWs ? defaultConfig.wsUrl : wsUrl,
        baseUrl: shouldResetBase ? defaultConfig.baseUrl : baseUrl
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 设置 WebSocket URL
  const handleSetWsUrl = useCallback((url: string) => {
    updateNetworkConfig({ wsUrl: url });
    wsService.connect(url);
  }, [updateNetworkConfig]);

  // ✅ 设置 Base URL
  const handleSetBaseUrl = useCallback((url: string) => {
    updateNetworkConfig({ baseUrl: url });
  }, [updateNetworkConfig]);

  const value = {
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState: 'CLOSED',
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl: handleSetWsUrl,
    baseUrl,
    setBaseUrl: handleSetBaseUrl,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
