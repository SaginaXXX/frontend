/**
 * 🔧 统一配置管理系统
 * 解决配置四散问题，提供优雅的配置管理方案
 */

export interface AppConfig {
  network: {
    defaultHost: string;
    defaultPort: number;
    fallbackPorts: number[];
    wsScheme: 'ws' | 'wss';
    httpScheme: 'http' | 'https';
  };
  timeouts: {
    autoCloseDelay: number;
    taskInterval: number;
    reconnectDelay: number;
    vadMisfireTimeout: number;
    healthCheckTimeout: number;
  };
  development: {
    devServerPort: number;
    hmrPort: number;
    detectDevPorts: number[];
  };
  paths: {
    libsPath: string;
    cachePath: string;
    staticPath: string;
  };
  ui: {
    toastDuration: number;
    transitionDuration: number;
    debounceDelay: number;
  };
}

// ✅ 统一的默认配置 - 消除硬编码
export const DEFAULT_CONFIG: AppConfig = {
  network: {
    defaultHost: '127.0.0.1',
    defaultPort: 12393,
    fallbackPorts: [12393, 8080, 3000, 5000],
    wsScheme: 'ws',
    httpScheme: 'http',
  },
  timeouts: {
    autoCloseDelay: 3000,
    taskInterval: 3000,
    reconnectDelay: 1000,
    vadMisfireTimeout: 2000,
    healthCheckTimeout: 5000,
  },
  development: {
    devServerPort: 3000,
    hmrPort: 5173,
    detectDevPorts: [5173, 3000, 8080],
  },
  paths: {
    libsPath: '/libs/',
    cachePath: '/cache/',
    staticPath: '/static/',
  },
  ui: {
    toastDuration: 2000,
    transitionDuration: 300,
    debounceDelay: 500,
  },
};

// ✅ 配置管理器类 - 单例模式
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromEnv();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 从环境变量加载配置
   * 支持运行时和构建时环境变量
   */
  private loadFromEnv(): void {
    // 网络配置
    if (import.meta.env.VITE_SERVER_HOST) {
      this.config.network.defaultHost = import.meta.env.VITE_SERVER_HOST;
    }
    if (import.meta.env.VITE_SERVER_PORT) {
      this.config.network.defaultPort = parseInt(import.meta.env.VITE_SERVER_PORT);
    }

    // 开发配置
    if (import.meta.env.VITE_DEV_PORT) {
      this.config.development.devServerPort = parseInt(import.meta.env.VITE_DEV_PORT);
    }

    // 超时配置
    if (import.meta.env.VITE_AUTO_CLOSE_DELAY) {
      this.config.timeouts.autoCloseDelay = parseInt(import.meta.env.VITE_AUTO_CLOSE_DELAY);
    }
  }

  // ✅ 配置访问器
  get network() { return this.config.network; }
  get timeouts() { return this.config.timeouts; }
  get development() { return this.config.development; }
  get paths() { return this.config.paths; }
  get ui() { return this.config.ui; }

  /**
   * 获取完整的 WebSocket URL
   */
  getWsUrl(host?: string, port?: number): string {
    const finalHost = host || this.config.network.defaultHost;
    const finalPort = port || this.config.network.defaultPort;
    return `${this.config.network.wsScheme}://${finalHost}:${finalPort}/client-ws`;
  }

  /**
   * 获取完整的 HTTP URL
   */
  getHttpUrl(host?: string, port?: number): string {
    const finalHost = host || this.config.network.defaultHost;
    const finalPort = port || this.config.network.defaultPort;
    return `${this.config.network.httpScheme}://${finalHost}:${finalPort}`;
  }

  /**
   * 检查是否为开发环境端口
   */
  isDevPort(port: number): boolean {
    return this.config.development.detectDevPorts.includes(port);
  }

  /**
   * 获取媒体文件URL
   */
  getMediaUrl(category: 'ads' | 'videos', filename: string): string {
    return `/${category}/${filename}`;
  }

  /**
   * 更新配置（运行时配置更新）
   */
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 获取完整配置
   */
  getConfig(): Readonly<AppConfig> {
    return Object.freeze({ ...this.config });
  }
}

// ✅ 导出单例实例
export const appConfig = ConfigManager.getInstance();

// ✅ 导出常用的配置快捷访问
export const NETWORK_CONFIG = appConfig.network;
export const TIMEOUT_CONFIG = appConfig.timeouts;
export const DEV_CONFIG = appConfig.development;
export const PATH_CONFIG = appConfig.paths;
export const UI_CONFIG = appConfig.ui;