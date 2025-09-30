/**
 * 🔧 环境配置工具 - 优雅的配置管理解决方案
 * 
 * ✅ 已解决的问题：
 * - 消除硬编码地址
 * - 统一配置管理
 * - 环境变量优先级
 * - 智能服务器发现
 * 
 * 注意：此文件运行在浏览器环境中，只能使用 Vite 的 import.meta.env
 */

import { appConfig } from '../config';

export interface ServerConfig {
  host: string;
  port: number;
  wsUrl: string;
  baseUrl: string;
}

/**
 * 获取当前页面的基础URL（用于相对路径访问）
 */
export function getCurrentBaseUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const currentUrl = new URL(window.location.href);
      return `${currentUrl.protocol}//${currentUrl.host}`;
    } catch (error) {
      console.warn('无法解析当前URL，使用默认配置:', error);
    }
  }
  // ✅ 使用统一配置替代硬编码
  return appConfig.getHttpUrl();
}

/**
 * 根据当前环境动态获取服务器配置
 */
export function getServerConfig(): ServerConfig {
  // Cache to avoid recomputation and duplicate logs on rerenders
  // Module-level cache
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof window !== 'undefined' && (window as any).__cachedServerConfig) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return (window as any).__cachedServerConfig as ServerConfig;
  }
  let devLogged = false;
  // 1. 优先级1：环境变量（构建时注入）
  // 注意：在浏览器环境中不能访问 process.env，只能使用 import.meta.env
  const envHost = import.meta.env?.VITE_SERVER_HOST;
  const envPort = import.meta.env?.VITE_SERVER_PORT;
  const envBaseUrl = import.meta.env?.VITE_API_BASE_URL;
  
  // 2. 优先级2：完整API基础URL（最灵活）
  if (envBaseUrl) {
    const apiUrl = new URL(envBaseUrl);
    const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`;
    const wsUrl = `${apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${apiUrl.host}/client-ws`;
    if (import.meta.env?.MODE === 'development' && !devLogged) {
      console.log(`🌐 使用环境变量API地址: ${baseUrl}`);
      devLogged = true;
    }
    const cfg = {
      host: apiUrl.hostname,
      port: parseInt(apiUrl.port) || (apiUrl.protocol === 'https:' ? 443 : 80),
      baseUrl,
      wsUrl
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof window !== 'undefined') (window as any).__cachedServerConfig = cfg;
    return cfg;
  }
  
  // 3. 优先级3：分别的主机名和端口环境变量
  if (envHost || envPort) {
    const host = envHost || appConfig.network.defaultHost;
    const port = envPort ? parseInt(envPort) : appConfig.network.defaultPort;
    const baseUrl = appConfig.getHttpUrl(host, port);
    const wsUrl = appConfig.getWsUrl(host, port);
    if (import.meta.env?.MODE === 'development' && !devLogged) {
      console.log(`🌐 使用环境变量配置: ${baseUrl}`);
      devLogged = true;
    }
    const cfg = { host, port, baseUrl, wsUrl };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof window !== 'undefined') (window as any).__cachedServerConfig = cfg;
    return cfg;
  }
  
  // 4. 优先级4：智能检测部署环境
  const currentBaseUrl = getCurrentBaseUrl();
  const currentUrl = new URL(currentBaseUrl);
  
  let host = currentUrl.hostname;
  let port: number;
  
  // ✅ 若页面本身在 HTTPS 下，强制使用同源的 HTTPS/WSS，避免混合内容与被浏览器阻止
  if (currentUrl.protocol === 'https:') {
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    const wsUrl = `wss://${currentUrl.host}/client-ws`;
    if (import.meta.env?.MODE === 'development' && !devLogged) {
      console.log(`🔒 检测到 HTTPS 部署环境，使用同源 API: ${baseUrl}`);
      devLogged = true;
    }
    const cfg = {
      host,
      port: currentUrl.port ? parseInt(currentUrl.port) : 443,
      baseUrl,
      wsUrl,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof window !== 'undefined') (window as any).__cachedServerConfig = cfg;
    return cfg;
  }
  
  // ✅ 使用配置化的智能检测
  const currentPort = currentUrl.port ? parseInt(currentUrl.port) : (currentUrl.protocol === 'https:' ? 443 : 80);
  
  if (appConfig.isDevPort(currentPort)) {
    // 开发环境：检测到开发服务器端口
    port = appConfig.network.defaultPort;
    if (import.meta.env?.MODE === 'development' && !devLogged) {
      console.log(`🔧 检测到开发环境 (端口:${currentPort})，API地址: ${host}:${port}`);
      devLogged = true;
    }
  } else if (currentPort === appConfig.network.defaultPort) {
    // 标准部署：前端和API在同一服务器
    port = appConfig.network.defaultPort;
    if (import.meta.env?.MODE === 'development' && !devLogged) {
      console.log(`🚀 检测到标准部署环境，API地址: ${host}:${port}`);
      devLogged = true;
    }
  } else {
    // 其他部署场景：使用默认API端口
    port = appConfig.network.defaultPort;
    if (import.meta.env?.MODE === 'development' && !devLogged) {
      console.log(`🌐 未知部署环境 (端口:${currentPort})，尝试API地址: ${host}:${port}`);
      devLogged = true;
    }
  }
  
  // ✅ 使用统一配置生成URL
  const baseUrl = appConfig.getHttpUrl(host, port);
  const wsUrl = appConfig.getWsUrl(host, port);
  
  if (import.meta.env?.MODE === 'development' && !devLogged) {
    console.log(`🌐 最终服务器配置: ${baseUrl} (当前页面: ${currentBaseUrl})`);
  }

  const cfg = {
    host,
    port,
    wsUrl,
    baseUrl
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof window !== 'undefined') (window as any).__cachedServerConfig = cfg;
  return cfg;
}

/**
 * 检查服务器是否可访问
 */
export async function checkServerHealth(baseUrl: string): Promise<boolean> {
  try {
    // ✅ 使用配置化的超时时间
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), appConfig.timeouts.healthCheckTimeout);
    
    const response = await fetch(`${baseUrl}/health`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`服务器健康检查失败: ${baseUrl}`, error);
    return false;
  }
}

/**
 * 自动发现服务器地址
 */
export async function discoverServerAddress(): Promise<ServerConfig> {
  const defaultConfig = getServerConfig();
  
  // 1. 首先尝试默认配置
  if (await checkServerHealth(defaultConfig.baseUrl)) {
    return defaultConfig;
  }
  
  // 2. 如果默认配置不可用，尝试其他常见配置
  const fallbackHosts = [
    appConfig.network.defaultHost,
    'localhost', 
    window.location.hostname, // 当前页面的hostname
  ];
  
  // ✅ 使用配置化的回退端口列表
  const fallbackPorts = appConfig.network.fallbackPorts;
  
  for (const host of fallbackHosts) {
    for (const port of fallbackPorts) {
      // ✅ 使用统一配置生成测试URL
      const testConfig: ServerConfig = {
        host,
        port,
        baseUrl: appConfig.getHttpUrl(host, port),
        wsUrl: appConfig.getWsUrl(host, port)
      };
      
      if (await checkServerHealth(testConfig.baseUrl)) {
        if (import.meta.env?.MODE === 'development') {
          console.log(`✅ 发现可用服务器: ${testConfig.baseUrl}`);
        }
        return testConfig;
      }
    }
  }
  
  // 3. 如果都不可用，返回默认配置
  console.warn('⚠️ 未找到可用服务器，使用默认配置');
  return defaultConfig;
}

/**
 * 获取媒体文件的相对路径URL
 * 基于后端已挂载的静态文件服务
 */
export function getMediaUrl(category: 'ads' | 'videos', filename: string): string {
  // ✅ 使用统一配置管理媒体URL
  return appConfig.getMediaUrl(category, filename);
}

/**
 * 获取广告视频URL
 */
export function getAdVideoUrl(filename: string): string {
  return getMediaUrl('ads', filename);
}

/**
 * 获取洗衣机教程视频URL
 */
export function getTutorialVideoUrl(filename: string): string {
  return getMediaUrl('videos', filename);
}