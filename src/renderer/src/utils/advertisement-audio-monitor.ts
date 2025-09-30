/**
 * 广告音频监听器 - 监控广告播放状态并与VAD系统通信
 * 实现有声广告与语音检测并存
 */

export interface AdAudioInfo {
  isPlaying: boolean;
  volume: number;
  averageAmplitude: number;
  peakAmplitude: number;
}

export class AdvertisementAudioMonitor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private monitoringInterval: number | null = null;
  private callbacks: Set<(info: AdAudioInfo) => void> = new Set();
  private isMonitoring = false;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      console.log('🎵 广告音频监听器初始化成功');
    } catch (error) {
      console.error('❌ 广告音频监听器初始化失败:', error);
    }
  }

  /**
   * 开始监听广告视频的音频
   */
  public startMonitoring(videoElement: HTMLVideoElement): void {
    if (!this.audioContext || !this.analyser) {
      return;
    }

    // ✅ 确保先停止之前的监听
    if (this.isMonitoring) {
      console.log('🔄 停止之前的音频监听...');
      this.stopMonitoring();
    }

    try {
      // ⚠️ 检查视频元素是否已经连接过音频源
      const existingSource = (videoElement as any).__audioSource;
      if (existingSource) {
        console.log('♻️ 重用现有的音频源连接');
        this.source = existingSource;
      } else {
        // 创建新的音频源节点
        this.source = this.audioContext.createMediaElementSource(videoElement);
        // 标记该视频元素已连接
        (videoElement as any).__audioSource = this.source;
      }
      
      // 连接音频管道：视频 -> 分析器 -> 扬声器（空值保护）
      if (!this.source || !this.analyser || !this.audioContext) {
        throw new Error('Audio graph not ready');
      }
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.isMonitoring = true;
      this.startAnalysis();
      
      console.log('🎤 开始监听广告音频');
    } catch (error) {
      console.error('❌ 开始监听失败:', error);
      // ✅ 错误时重置状态
      this.isMonitoring = false;
      this.source = null;
    }
  }

  /**
   * 停止监听
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.source) {
      try {
        this.source.disconnect();
        console.log('🔌 音频源已断开连接');
      } catch (error) {
        console.warn('断开音频源连接时出错:', error);
      }
      this.source = null;
    }
    // 断开分析器与输出的连接，确保无残留音频链路
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (error) {
        console.warn('断开分析器连接时出错:', error);
      }
    }
    
    this.isMonitoring = false;
    console.log('🔇 停止监听广告音频');

    // 通知所有监听者当前无音频播放，便于前端/后端重置阈值
    const info = {
      isPlaying: false,
      volume: 0,
      averageAmplitude: 0,
      peakAmplitude: 0,
    };
    this.callbacks.forEach((cb) => {
      try { cb(info); } catch (_) {}
    });
  }

  /**
   * 完整释放资源：关闭AudioContext并清理引用
   */
  public async dispose(): Promise<void> {
    try {
      this.stopMonitoring();
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        console.log('🧹 广告音频上下文已关闭');
      }
    } catch (error) {
      console.warn('关闭音频上下文时出错:', error);
    } finally {
      this.audioContext = null;
      this.analyser = null;
    }
  }

  /**
   * 添加音频信息回调
   */
  public addCallback(callback: (info: AdAudioInfo) => void): void {
    this.callbacks.add(callback);
  }

  /**
   * 移除音频信息回调
   */
  public removeCallback(callback: (info: AdAudioInfo) => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * 开始音频分析
   */
  private startAnalysis(): void {
    this.monitoringInterval = window.setInterval(() => {
      this.analyzeAudio();
    }, 100); // 每100ms分析一次
  }

  /**
   * 分析音频数据
   */
  private analyzeAudio(): void {
    if (!this.analyser) {
      return;
    }

    // 获取频率域数据到本地缓冲，避免类型不匹配
    const freqData: Uint8Array = new Uint8Array(this.analyser.frequencyBinCount);
    (this.analyser as any).getByteFrequencyData(freqData as any);
    
    // 计算音频特征
    const averageAmplitude = this.calculateAverage(freqData);
    let peakAmplitude = 0;
    for (let i = 0; i < freqData.length; i += 1) {
      if (freqData[i] > peakAmplitude) peakAmplitude = freqData[i];
    }
    const volume = averageAmplitude / 255; // 归一化到0-1
    
    // 判断是否有声音播放
    const isPlaying = averageAmplitude > 10; // 阈值可调
    
    const audioInfo: AdAudioInfo = {
      isPlaying,
      volume,
      averageAmplitude,
      peakAmplitude
    };

    // 通知所有回调
    this.callbacks.forEach(callback => {
      try {
        callback(audioInfo);
      } catch (error) {
        console.error('音频回调执行失败:', error);
      }
    });
  }

  /**
   * 计算数组平均值
   */
  private calculateAverage(array: ArrayLike<number>): number {
    let sum = 0;
    for (let i = 0; i < array.length; i += 1) {
      sum += Number(array[i]);
    }
    return array.length ? sum / array.length : 0;
  }

  /**
   * 获取当前音频上下文状态
   */
  public getAudioContextState(): string | null {
    return this.audioContext?.state || null;
  }

  /**
   * 恢复音频上下文（用户交互后）
   */
  public async resumeAudioContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
      console.log('🔊 音频上下文已恢复');
    }
  }
}

// 全局实例
export const adAudioMonitor = new AdvertisementAudioMonitor();