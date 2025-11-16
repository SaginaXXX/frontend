/**
 * Store 配置和工具函数
 */

/**
 * 动态获取环境配置（避免在部署环境使用硬编码的本地地址）
 */
export function getInitialServerConfig() {
  try {
    // 检测当前环境
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // HTTPS 环境：使用同源 WSS
      const host = window.location.host;
      return {
        wsUrl: `wss://${host}/client-ws`,
        baseUrl: `https://${host}`
      };
    }
  } catch (e) {
    console.warn('⚠️ 环境检测失败，使用默认配置');
  }
  
  // 默认：开发环境本地地址
  return {
    wsUrl: 'ws://127.0.0.1:12393/client-ws',
    baseUrl: 'http://127.0.0.1:12393'
  };
}

/**
 * persist 中间件的智能合并函数
 * HTTPS 环境下忽略 localStorage 中的本地地址
 */
export function smartMerge(persistedState: any, currentState: any) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  
  // 检测 localStorage 中是否有本地地址
  const hasLocalAddress = persistedState?.config?.wsUrl && 
    /127\.0\.0\.1|localhost/i.test(persistedState.config.wsUrl);
  
  // HTTPS 环境下，如果 localStorage 存的是本地地址，忽略它
  if (isHttps && hasLocalAddress) {
    console.log('🔒 检测到 HTTPS 环境，忽略 localStorage 中的本地地址配置');
    return {
      ...currentState,
      ...persistedState,
      config: {
        ...persistedState.config,
        // 使用环境检测的值，而不是 localStorage 的本地地址
        wsUrl: currentState.config.wsUrl,
        baseUrl: currentState.config.baseUrl,
      },
    };
  }
  
  // 其他情况：正常合并
  return {
    ...currentState,
    ...persistedState,
  };
}

