import { toaster } from '@/components/ui/toaster';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'network',
  WEBSOCKET = 'websocket',
  MEDIA = 'media',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * 标准化错误接口
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: string;
  timestamp: number;
  recoverable: boolean;
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  attempt: () => Promise<void> | void;
  maxRetries: number;
  retryDelay: number;
}

/**
 * 全局错误处理器类
 */
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;
  private recoveryStrategies = new Map<ErrorType, RecoveryStrategy>();

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private constructor() {
    this.setupGlobalHandlers();
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * 设置全局错误监听器
   */
  private setupGlobalHandlers() {
    // 捕获未处理的Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 未处理的Promise rejection:', event.reason);
      
      const appError: AppError = {
        type: ErrorType.UNKNOWN,
        message: event.reason?.message || '异步操作失败',
        originalError: event.reason,
        context: 'unhandledrejection',
        timestamp: Date.now(),
        recoverable: false,
      };

      this.handleError(appError);
      
      // 防止在控制台显示错误
      event.preventDefault();
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('🚨 全局JavaScript错误:', event.error);
      
      const appError: AppError = {
        type: ErrorType.UNKNOWN,
        message: event.message,
        originalError: event.error,
        context: `${event.filename}:${event.lineno}:${event.colno}`,
        timestamp: Date.now(),
        recoverable: false,
      };

      this.handleError(appError);
    });
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultRecoveryStrategies() {
    // WebSocket重连策略
    this.recoveryStrategies.set(ErrorType.WEBSOCKET, {
      attempt: async () => {
        // 由WebSocketService处理重连
        console.log('🔄 尝试WebSocket重连...');
      },
      maxRetries: 3,
      retryDelay: 2000,
    });

    // 网络错误重试策略
    this.recoveryStrategies.set(ErrorType.NETWORK, {
      attempt: async () => {
        console.log('🔄 检查网络连接...');
        // 可以添加网络状态检查
      },
      maxRetries: 2,
      retryDelay: 1000,
    });
  }

  /**
   * 统一错误处理入口
   */
  public handleError(error: AppError): void {
    // 记录错误历史
    this.addToHistory(error);

    // 控制台输出
    console.error(`🚨 [${error.type.toUpperCase()}] ${error.message}`, {
      context: error.context,
      originalError: error.originalError,
      timestamp: new Date(error.timestamp).toISOString(),
    });

    // 用户通知
    this.notifyUser(error);

    // 尝试恢复
    if (error.recoverable) {
      this.attemptRecovery(error.type);
    }

    // 发送到监控系统
    this.reportToMonitoring(error);
  }

  /**
   * 便捷方法：处理网络错误
   */
  public handleNetworkError(originalError: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.NETWORK,
      message: this.getNetworkErrorMessage(originalError),
      originalError,
      context,
      timestamp: Date.now(),
      recoverable: true,
    };
    
    this.handleError(appError);
  }

  /**
   * 便捷方法：处理WebSocket错误
   */
  public handleWebSocketError(originalError: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.WEBSOCKET,
      message: '连接已断开，正在尝试重连...',
      originalError,
      context,
      timestamp: Date.now(),
      recoverable: true,
    };
    
    this.handleError(appError);
  }

  /**
   * 便捷方法：处理媒体错误
   */
  public handleMediaError(originalError: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.MEDIA,
      message: '媒体播放失败，请检查文件格式',
      originalError,
      context,
      timestamp: Date.now(),
      recoverable: false,
    };
    
    this.handleError(appError);
  }

  /**
   * 便捷方法：处理权限错误
   */
  public handlePermissionError(originalError: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.PERMISSION,
      message: '权限被拒绝，请检查浏览器设置',
      originalError,
      context,
      timestamp: Date.now(),
      recoverable: false,
    };
    
    this.handleError(appError);
  }

  /**
   * 获取网络错误的用户友好消息
   */
  private getNetworkErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch')) {
      return '网络请求失败，请检查网络连接';
    }
    if (message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    if (message.includes('cors')) {
      return '跨域请求被阻止';
    }
    
    return '网络连接异常，请检查网络设置';
  }

  /**
   * 通知用户
   */
  private notifyUser(error: AppError): void {
    // 避免相同错误的重复通知（1分钟内）
    const recentSimilarError = this.errorHistory
      .filter(e => e.type === error.type && e.message === error.message)
      .find(e => Date.now() - e.timestamp < 60000);

    if (recentSimilarError) {
      return; // 跳过重复通知
    }

    // 根据错误类型选择通知方式
    const toastType = error.recoverable ? 'warning' : 'error';
    const duration = error.recoverable ? 3000 : 5000;

    toaster.create({
      title: this.getErrorTitle(error.type),
      description: error.message,
      type: toastType,
      duration,
    });
  }

  /**
   * 获取错误标题
   */
  private getErrorTitle(type: ErrorType): string {
    const titles = {
      [ErrorType.NETWORK]: '网络错误',
      [ErrorType.WEBSOCKET]: '连接错误',
      [ErrorType.MEDIA]: '媒体错误',
      [ErrorType.PERMISSION]: '权限错误',
      [ErrorType.VALIDATION]: '数据验证错误',
      [ErrorType.UNKNOWN]: '系统错误',
    };
    
    return titles[type] || '未知错误';
  }

  /**
   * 尝试错误恢复
   */
  private async attemptRecovery(errorType: ErrorType): Promise<void> {
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      return;
    }

    let retries = 0;
    while (retries < strategy.maxRetries) {
      try {
        console.log(`🔄 尝试恢复 ${errorType} (${retries + 1}/${strategy.maxRetries})`);
        await strategy.attempt();
        console.log(`✅ ${errorType} 恢复成功`);
        return;
      } catch (recoveryError) {
        retries++;
        console.warn(`❌ 恢复失败 (${retries}/${strategy.maxRetries}):`, recoveryError);
        
        if (retries < strategy.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, strategy.retryDelay));
        }
      }
    }

    console.error(`💀 ${errorType} 恢复失败，已达到最大重试次数`);
  }

  /**
   * 记录错误历史
   */
  private addToHistory(error: AppError): void {
    this.errorHistory.push(error);
    
    // 保持历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * 发送到监控系统
   */
  private reportToMonitoring(error: AppError): void {
    // TODO: 集成监控系统 (Sentry, LogRocket等)
    try {
      // window.Sentry?.captureException(error.originalError || new Error(error.message), {
      //   tags: {
      //     errorType: error.type,
      //     recoverable: error.recoverable.toString(),
      //   },
      //   extra: {
      //     context: error.context,
      //     timestamp: error.timestamp,
      //   },
      // });
    } catch (monitoringError) {
      console.warn('📊 监控报告发送失败:', monitoringError);
    }
  }

  /**
   * 获取错误历史
   */
  public getErrorHistory(): readonly AppError[] {
    return Object.freeze([...this.errorHistory]);
  }

  /**
   * 清除错误历史
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 注册自定义恢复策略
   */
  public registerRecoveryStrategy(errorType: ErrorType, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
  }
}

// 导出单例实例
export const errorHandler = GlobalErrorHandler.getInstance();

/**
 * React Hook 用于组件中的错误处理
 */
export const useErrorHandler = () => {
  return {
    handleNetworkError: errorHandler.handleNetworkError.bind(errorHandler),
    handleWebSocketError: errorHandler.handleWebSocketError.bind(errorHandler),
    handleMediaError: errorHandler.handleMediaError.bind(errorHandler),
    handlePermissionError: errorHandler.handlePermissionError.bind(errorHandler),
    handleError: errorHandler.handleError.bind(errorHandler),
  };
};