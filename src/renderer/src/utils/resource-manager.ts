/**
 * 增强版统一资源管理器
 * 负责管理应用中所有资源的生命周期，防止内存泄漏
 * 新增: 性能监控、自动清理、内存估算
 */

export interface Resource {
  id: string;
  type: ResourceType;
  cleanup: () => void | Promise<void>;
  description?: string;
  createdAt: number;
  lastAccessed?: number; // 最后访问时间
  priority?: 'high' | 'medium' | 'low'; // 优先级
  estimatedMemoryKB?: number; // 估计内存使用（KB）
}

export enum ResourceType {
  AUDIO_CONTEXT = 'audio_context',
  MEDIA_ELEMENT = 'media_element',
  WEBSOCKET = 'websocket',
  EVENT_LISTENER = 'event_listener',
  INTERVAL = 'interval',
  TIMEOUT = 'timeout',
  PIXI_APP = 'pixi_app',
  VAD_INSTANCE = 'vad_instance',
  OBSERVER = 'observer',
  STREAM = 'stream',
}

/**
 * 全局资源管理器
 */
class ResourceManager {
  private static instance: ResourceManager;
  private resources = new Map<string, Resource>();
  private cleanupCallbacks = new Set<() => void>();

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  private constructor() {
    // 页面卸载时自动清理所有资源
    window.addEventListener('beforeunload', () => {
      this.cleanupAll();
    });

    // 页面隐藏时清理部分资源
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupNonEssentialResources();
      }
    });
  }

  /**
   * 注册资源
   */
  register(resource: Omit<Resource, 'createdAt'>): string {
    const fullResource: Resource = {
      ...resource,
      createdAt: Date.now(),
    };
    
    this.resources.set(resource.id, fullResource);
    
    console.log(`📝 注册资源 [${resource.type}] ${resource.id}:`, resource.description);
    
    return resource.id;
  }

  /**
   * 快速注册 - 使用自动生成的ID
   */
  registerQuick(
    type: ResourceType, 
    cleanup: () => void | Promise<void>, 
    description?: string
  ): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.register({ id, type, cleanup, description });
  }

  /**
   * 注册AudioContext资源
   */
  registerAudioContext(
    audioContext: AudioContext,
    description?: string
  ): string {
    return this.registerQuick(
      ResourceType.AUDIO_CONTEXT,
      async () => {
        if (audioContext.state !== 'closed') {
          await audioContext.close();
          console.log('🔇 AudioContext已关闭');
        }
      },
      description || 'AudioContext实例'
    );
  }

  /**
   * 注册WebSocket连接
   */
  registerWebSocket(
    websocket: WebSocket,
    description?: string
  ): string {
    return this.registerQuick(
      ResourceType.WEBSOCKET,
      () => {
        if (websocket.readyState === WebSocket.OPEN || 
            websocket.readyState === WebSocket.CONNECTING) {
          websocket.close();
          console.log('🔌 WebSocket连接已关闭');
        }
      },
      description || 'WebSocket连接'
    );
  }

  /**
   * 注册事件监听器
   */
  registerEventListener(
    target: EventTarget,
    event: string,
    listener: EventListener,
    description?: string
  ): string {
    return this.registerQuick(
      ResourceType.EVENT_LISTENER,
      () => {
        target.removeEventListener(event, listener);
        console.log(`🎧 事件监听器已移除: ${event}`);
      },
      description || `${event} 事件监听器`
    );
  }

  /**
   * 注册定时器
   */
  registerInterval(intervalId: number, description?: string): string {
    return this.registerQuick(
      ResourceType.INTERVAL,
      () => {
        clearInterval(intervalId);
        console.log('⏰ 定时器已清除');
      },
      description || 'setInterval定时器'
    );
  }

  /**
   * 注册超时器
   */
  registerTimeout(timeoutId: number, description?: string): string {
    return this.registerQuick(
      ResourceType.TIMEOUT,
      () => {
        clearTimeout(timeoutId);
        console.log('⏱️ 超时器已清除');
      },
      description || 'setTimeout超时器'
    );
  }

  /**
   * 注册PIXI应用
   */
  registerPixiApp(app: any, description?: string): string {
    return this.registerQuick(
      ResourceType.PIXI_APP,
      () => {
        if (app && app.destroy) {
          app.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true,
          });
          console.log('🎨 PIXI应用已销毁');
        }
      },
      description || 'PIXI Application'
    );
  }

  /**
   * 注册媒体流
   */
  registerMediaStream(stream: MediaStream, description?: string): string {
    return this.registerQuick(
      ResourceType.STREAM,
      () => {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`📹 媒体轨道已停止: ${track.kind}`);
        });
      },
      description || 'MediaStream'
    );
  }

  /**
   * 注册观察者
   */
  registerObserver(observer: any, description?: string): string {
    return this.registerQuick(
      ResourceType.OBSERVER,
      () => {
        if (observer && observer.disconnect) {
          observer.disconnect();
          console.log('👁️ 观察者已断开');
        } else if (observer && observer.unobserve) {
          observer.unobserve();
          console.log('👁️ 观察者已取消观察');
        }
      },
      description || 'Observer'
    );
  }

  /**
   * 清理指定资源
   */
  async cleanup(resourceId: string): Promise<boolean> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      console.warn(`⚠️ 未找到资源: ${resourceId}`);
      return false;
    }

    try {
      await resource.cleanup();
      this.resources.delete(resourceId);
      console.log(`✅ 资源已清理 [${resource.type}] ${resourceId}`);
      return true;
    } catch (error) {
      console.error(`❌ 资源清理失败 [${resource.type}] ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * 按类型清理资源
   */
  async cleanupByType(type: ResourceType): Promise<number> {
    const resourcesOfType = Array.from(this.resources.values())
      .filter(resource => resource.type === type);
    
    let cleanedCount = 0;
    for (const resource of resourcesOfType) {
      const success = await this.cleanup(resource.id);
      if (success) cleanedCount++;
    }

    console.log(`🧹 已清理 ${cleanedCount}/${resourcesOfType.length} 个 ${type} 类型资源`);
    return cleanedCount;
  }

  /**
   * 清理非必要资源（页面隐藏时）
   */
  async cleanupNonEssentialResources(): Promise<void> {
    const nonEssentialTypes = [
      ResourceType.INTERVAL,
      ResourceType.TIMEOUT,
      ResourceType.OBSERVER,
    ];

    for (const type of nonEssentialTypes) {
      await this.cleanupByType(type);
    }
  }

  /**
   * 清理所有资源
   */
  async cleanupAll(): Promise<void> {
    console.log('🧹 开始清理所有资源...');
    
    const resourceIds = Array.from(this.resources.keys());
    let cleanedCount = 0;
    
    for (const resourceId of resourceIds) {
      const success = await this.cleanup(resourceId);
      if (success) cleanedCount++;
    }
    
    // 执行额外的清理回调
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('清理回调执行失败:', error);
      }
    });
    this.cleanupCallbacks.clear();

    console.log(`✅ 资源清理完成: ${cleanedCount}/${resourceIds.length} 个资源已清理`);
  }

  /**
   * 注册清理回调
   */
  onCleanup(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * 获取资源统计
   */
  getResourceStats(): Record<ResourceType, number> {
    const stats = {} as Record<ResourceType, number>;
    
    // 初始化所有类型为0
    Object.values(ResourceType).forEach(type => {
      stats[type] = 0;
    });
    
    // 统计实际数量
    this.resources.forEach(resource => {
      stats[resource.type]++;
    });
    
    return stats;
  }

  /**
   * 获取所有资源信息
   */
  getAllResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  /**
   * 获取资源数量
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 检查是否有长时间未清理的资源
   */
  checkForLeaks(maxAgeMs: number = 300000): Resource[] { // 5分钟
    const now = Date.now();
    return Array.from(this.resources.values())
      .filter(resource => now - resource.createdAt > maxAgeMs);
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    totalResources: number;
    estimatedMemoryKB: number;
    leakedResources: Resource[];
    highPriorityCount: number;
    oldestResourceAge: number;
    recommendations: string[];
  } {
    const resources = Array.from(this.resources.values());
    const now = Date.now();
    
    const estimatedMemoryKB = resources.reduce((total, resource) => {
      return total + (resource.estimatedMemoryKB || this.getDefaultMemoryEstimate(resource.type));
    }, 0);
    
    const leakedResources = this.checkForLeaks();
    const highPriorityCount = resources.filter(r => r.priority === 'high').length;
    
    const oldestResourceAge = resources.length > 0 
      ? Math.max(...resources.map(r => now - r.createdAt))
      : 0;
    
    const recommendations: string[] = [];
    
    if (estimatedMemoryKB > 50000) { // >50MB
      recommendations.push('内存使用过高，建议清理PIXI和WebAudio资源');
    }
    
    if (leakedResources.length > 0) {
      recommendations.push(`发现${leakedResources.length}个可能泄漏的资源`);
    }
    
    if (resources.length > 100) {
      recommendations.push('资源数量过多，建议启用自动清理');
    }
    
    return {
      totalResources: resources.length,
      estimatedMemoryKB,
      leakedResources,
      highPriorityCount,
      oldestResourceAge,
      recommendations
    };
  }

  /**
   * 获取默认内存估算
   */
  private getDefaultMemoryEstimate(type: ResourceType): number {
    const estimates: Record<ResourceType, number> = {
      [ResourceType.AUDIO_CONTEXT]: 200,     // 200KB
      [ResourceType.MEDIA_ELEMENT]: 50,      // 50KB
      [ResourceType.WEBSOCKET]: 20,          // 20KB
      [ResourceType.EVENT_LISTENER]: 1,      // 1KB
      [ResourceType.INTERVAL]: 5,            // 5KB
      [ResourceType.TIMEOUT]: 3,             // 3KB
      [ResourceType.PIXI_APP]: 1000,         // 1MB
      [ResourceType.VAD_INSTANCE]: 500,      // 500KB
      [ResourceType.OBSERVER]: 10,           // 10KB
      [ResourceType.STREAM]: 100,            // 100KB
    };
    
    return estimates[type] || 15;
  }

  /**
   * 启用自动清理（基于时间和优先级）
   */
  enableAutoCleanup(intervalMs: number = 60000): void { // 1分钟检查一次
    const cleanupInterval = setInterval(async () => {
      const now = Date.now();
      const resourcesToCleanup: string[] = [];
      
      // 清理5分钟未访问的低优先级资源
      this.resources.forEach((resource, id) => {
        const lastAccessed = resource.lastAccessed || resource.createdAt;
        const age = now - lastAccessed;
        
        if (age > 300000 && resource.priority === 'low') { // 5分钟
          resourcesToCleanup.push(id);
        }
      });
      
      if (resourcesToCleanup.length > 0) {
        console.log(`🤖 自动清理 ${resourcesToCleanup.length} 个低优先级资源`);
        for (const id of resourcesToCleanup) {
          await this.cleanup(id);
        }
      }
    }, intervalMs);
    
    // 注册清理定时器本身
    this.registerQuick(
      ResourceType.INTERVAL,
      () => clearInterval(cleanupInterval),
      '自动清理定时器'
    );
  }

  /**
   * 标记资源为已访问
   */
  touch(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.lastAccessed = Date.now();
    }
  }
}

// 导出单例实例
export const resourceManager = ResourceManager.getInstance();

// React Hook will be exported separately to avoid circular dependencies