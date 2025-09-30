/**
 * 网络性能优化管理器
 * 提供请求合并、缓存、去重等功能
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestConfig {
  cacheKey?: string;
  cacheTTL?: number; // 缓存生存时间（毫秒）
  timeout?: number;
  debounceMs?: number; // 防抖时间
  retries?: number;
}

class NetworkPerformanceManager {
  private static instance: NetworkPerformanceManager;
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, number>();
  private requestStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    deduplicatedRequests: 0,
    failedRequests: 0,
  };

  static getInstance(): NetworkPerformanceManager {
    if (!this.instance) {
      this.instance = new NetworkPerformanceManager();
    }
    return this.instance;
  }

  private constructor() {
    // 定期清理过期缓存
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 优化的fetch请求 - 支持缓存、去重、防抖
   */
  async optimizedFetch<T = any>(
    url: string, 
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      cacheKey = url,
      cacheTTL = 300000, // 默认5分钟缓存
      timeout = 10000,
      debounceMs = 0,
      retries = 0
    } = config;

    this.requestStats.totalRequests++;

    // 1. 检查缓存
    const cachedResult = this.getFromCache<T>(cacheKey);
    if (cachedResult) {
      this.requestStats.cacheHits++;
      console.log(`📦 缓存命中: ${cacheKey}`);
      return cachedResult;
    }
    this.requestStats.cacheMisses++;

    // 2. 防抖处理
    if (debounceMs > 0) {
      return this.debounceRequest(cacheKey, debounceMs, () => 
        this.executeRequest<T>(url, options, timeout, retries, cacheKey, cacheTTL)
      );
    }

    // 3. 请求去重 - 如果相同请求正在进行，等待结果
    if (this.pendingRequests.has(cacheKey)) {
      this.requestStats.deduplicatedRequests++;
      console.log(`🔄 请求去重: ${cacheKey}`);
      return this.pendingRequests.get(cacheKey)!;
    }

    // 4. 执行实际请求
    const requestPromise = this.executeRequest<T>(url, options, timeout, retries, cacheKey, cacheTTL);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * 执行实际的网络请求
   */
  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    timeout: number,
    retries: number,
    cacheKey: string,
    cacheTTL: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as T;
        
        // 缓存成功的响应
        this.setCache(cacheKey, data, cacheTTL);
        
        console.log(`✅ 网络请求成功: ${url} (尝试 ${attempt + 1}/${retries + 1})`);
        return data;

      } catch (error) {
        lastError = error as Error;
        this.requestStats.failedRequests++;
        
        if (attempt < retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数退避，最大5秒
          console.warn(`⚠️ 请求失败，${backoffMs}ms后重试 (${attempt + 1}/${retries + 1}): ${error}`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    console.error(`❌ 请求最终失败: ${url}`, lastError!);
    throw lastError!;
  }

  /**
   * 防抖请求
   */
  private debounceRequest<T>(
    key: string, 
    delayMs: number, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // 清除之前的定时器
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }

      // 设置新的防抖定时器
      const timerId = window.setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);

      this.debounceTimers.set(key, timerId);
    });
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 清理了 ${cleaned} 个过期缓存条目`);
    }
  }

  /**
   * 预加载资源
   */
  async preloadResources(urls: string[], options: RequestConfig = {}): Promise<void> {
    console.log(`🚀 开始预加载 ${urls.length} 个资源`);
    
    const promises = urls.map(url => 
      this.optimizedFetch(url, {}, { 
        ...options, 
        cacheTTL: options.cacheTTL || 600000 // 预加载资源缓存10分钟
      }).catch(error => {
        console.warn(`预加载失败: ${url}`, error);
        return null;
      })
    );

    await Promise.allSettled(promises);
    console.log(`✅ 资源预加载完成`);
  }

  /**
   * 批量请求优化 - 将多个请求合并
   */
  async batchRequests<T = any>(
    requests: Array<{ url: string; options?: RequestInit; config?: RequestConfig }>,
    batchConfig: { concurrency?: number; delayBetweenBatches?: number } = {}
  ): Promise<Array<T | Error>> {
    const { concurrency = 3, delayBetweenBatches = 100 } = batchConfig;
    const results: Array<T | Error> = [];
    
    console.log(`📦 批量执行 ${requests.length} 个请求 (并发: ${concurrency})`);

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async ({ url, options = {}, config = {} }) => {
        try {
          return await this.optimizedFetch<T>(url, options, config);
        } catch (error) {
          return error as Error;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 批次间延迟，避免服务器压力过大
      if (i + concurrency < requests.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`✅ 批量请求完成: ${results.filter(r => !(r instanceof Error)).length}/${requests.length} 成功`);
    return results;
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): number {
    if (!pattern) {
      const count = this.cache.size;
      this.cache.clear();
      console.log(`🧹 清除了所有缓存 (${count} 条)`);
      return count;
    }

    let cleared = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    console.log(`🧹 清除了匹配 "${pattern}" 的缓存 (${cleared} 条)`);
    return cleared;
  }

  /**
   * 获取网络性能统计
   */
  getNetworkStats(): {
    requests: typeof this.requestStats;
    cache: { size: number; hitRate: number };
    pendingRequests: number;
  } {
    const hitRate = this.requestStats.totalRequests > 0 
      ? (this.requestStats.cacheHits / this.requestStats.totalRequests) * 100 
      : 0;

    return {
      requests: { ...this.requestStats },
      cache: {
        size: this.cache.size,
        hitRate: Math.round(hitRate * 100) / 100
      },
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.requestStats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      deduplicatedRequests: 0,
      failedRequests: 0,
    };
  }
}

export const networkManager = NetworkPerformanceManager.getInstance();