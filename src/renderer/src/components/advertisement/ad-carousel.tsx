import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useWebSocket } from '../../context/websocket-context';
import { wsService } from '../../services/websocket-service';
import { adAudioMonitor, AdAudioInfo } from '../../utils/advertisement-audio-monitor';
import { useVAD } from '@/context/vad-context';

// 广告接口
interface Advertisement {
  id: string;
  name: string;
  filename: string;
  url_path: string;
  size_mb: number;
  format: string;
}

// 广告轮播组件属性接口
interface AdCarouselProps {
  isVisible: boolean;
  onRequestAdvertisements?: () => void;
  enableAudioWithVAD?: boolean; // 新增：启用有声广告+VAD并存模式
  defaultAudioEnabled?: boolean; // 新增：默认是否启用音频
  fitMode?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'; // 新增：广告视频适配模式
}

// 广告轮播组件
export const AdCarousel: React.FC<AdCarouselProps> = memo(({ 
  isVisible, 
  onRequestAdvertisements: _onRequestAdvertisements,
  enableAudioWithVAD = true,  // 🎵 默认启用有声+VAD模式
  defaultAudioEnabled = true,  // 🔊 默认启用音频
  fitMode = 'fill' // 默认拉伸填满自定义窗口（不留边，可能变形）
}) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioInfo, setAudioInfo] = useState<AdAudioInfo>({ isPlaying: false, volume: 0, averageAmplitude: 0, peakAmplitude: 0 });
  const [pendingRefresh, setPendingRefresh] = useState(false); // 🔄 标记是否有待处理的刷新
  const [isAudioMode] = useState(defaultAudioEnabled);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutsRef = useRef<number[]>([]); // ✅ 追踪所有 setTimeout，防止内存泄漏
  const { startMic } = useVAD();
  
  // ✅ 使用 ref 存储 startMic，避免闭包陷阱
  const startMicRef = useRef(startMic);
  useEffect(() => { startMicRef.current = startMic; }, [startMic]);
  
  // 使用WebSocket Context
  const { sendMessage, wsState: _wsState, baseUrl } = useWebSocket();
  
  // 连接就绪状态
  const [isConnectionReady, setIsConnectionReady] = useState(false);
  
  // 设置消息监听器来处理MCP工具响应和连接状态
  useEffect(() => {
    const subscription = wsService.onMessage((message: any) => {
      // 监听连接建立消息
      if (message.type === 'full-text' && message.text === 'Connection established') {
        console.log('🔗 AdCarousel: WebSocket连接已建立');
        setIsConnectionReady(true);
      }
      
      // 处理MCP工具响应
      if (message.type === 'mcp-tool-response' && (message.tool_name === 'get_advertisement_playlist' || message.tool_name === 'refresh_advertisements')) {
        console.log('✅ 收到MCP工具响应:', message);
        
        // 检查是否有错误
        if (message.error) {
          console.error('❌ AdCarousel: MCP工具调用失败:', message.error);
          setIsLoading(false);
          return;
        }
        
        try {
          // 新的数据结构：message.result = [{tool_id, content, is_error}]
          if (message.result && Array.isArray(message.result) && message.result.length > 0) {
            const toolResult = message.result[0];
            
            // 检查工具执行是否成功
            if (toolResult.is_error) {
              console.error('❌ AdCarousel: 工具执行失败:', toolResult.content);
              setAdvertisements([]);
              setIsLoading(false);
              return;
            }
            
            const jsonText = toolResult.content;
            console.log('📋 解析工具响应数据:', jsonText);
            
            // 解析JSON字符串
            const parsedData = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
            
            // 🔄 如果是刷新响应，只记录日志，不处理数据
            if (message.tool_name === 'refresh_advertisements') {
              console.log('🔄 广告刷新完成:', parsedData.message || '刷新成功');
              return; // 不处理刷新响应的数据，等待播放列表响应
            }
            
            // 检查数据结构：{type: "advertisement_playlist", playlist: [...]}
            if (parsedData && parsedData.playlist && Array.isArray(parsedData.playlist)) {
              const ads: Advertisement[] = parsedData.playlist.map((ad: any, index: number) => ({
                id: `ad_${index + 1}`,
                name: ad.name || ad.filename?.replace(/\.[^/.]+$/, "") || `Advertisement ${index + 1}`,
                filename: ad.filename,
                url_path: ad.url_path,
                size_mb: ad.size_mb || 0,
                format: ad.format || '.mp4'
              }));
              
              setAdvertisements(ads);
              // ✅ 智能索引管理：只在必要时重置
              if (currentIndex >= ads.length) {
                // 如果当前索引超出新列表范围，调整到最后一个有效位置
                const newIndex = Math.max(0, ads.length - 1);
                console.log(`🔧 AdCarousel: 广告列表更新，索引调整 ${currentIndex} -> ${newIndex}`);
                setCurrentIndex(newIndex);
              }
              // 否则保持当前索引不变，避免播放中断
              console.log(`🎬 AdCarousel: 成功加载了 ${ads.length} 个广告`);
            } else {
              console.warn('⚠️ AdCarousel: 广告播放列表为空');
              setAdvertisements([]);
              // 🔄 重置索引到0
              setCurrentIndex(0);
            }
          } else {
            console.warn('⚠️ AdCarousel: MCP响应格式异常 - result为空或非数组');
            setAdvertisements([]);
            // 🔄 重置索引到0
            setCurrentIndex(0);
          }
        } catch (error) {
          console.error('❌ AdCarousel: 解析广告列表响应失败:', error);
          setAdvertisements([]);
          // 🔄 重置索引到0
          setCurrentIndex(0);
        }
        
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // 移除依赖，避免重复订阅

  // 获取广告列表 - 简化版本
  const fetchAdvertisements = useCallback(async () => {
    try {
      console.log('🎬 AdCarousel: 请求广告列表...');
      
      // 🔄 首先刷新MCP服务器的广告列表
      const refreshRequest = {
        type: 'mcp-tool-call',
        tool_name: 'refresh_advertisements',
        arguments: {}
      };
      
      console.log('🔄 发送刷新请求:', refreshRequest);
      sendMessage(refreshRequest);
      
      // ✅ 延迟一点，确保刷新完成后再获取列表（追踪定时器）
      const timer1 = window.setTimeout(() => {
        // 发送MCP工具调用请求
        const toolRequest = {
          type: 'mcp-tool-call',
          tool_name: 'get_advertisement_playlist',
          arguments: {}
        };
        
        console.log('📡 发送广告列表请求:', toolRequest);
        sendMessage(toolRequest);
      }, 500); // 等待500ms确保刷新完成
      timeoutsRef.current.push(timer1);
      
      // 响应将通过全局消息监听器处理
      
      // ✅ 设置请求超时（追踪定时器）
      const timer2 = window.setTimeout(() => {
        if (isLoading) {
          console.error('❌ 广告列表请求超时');
          setIsLoading(false);
        }
      }, 8000); // 8秒超时（单个请求）
      timeoutsRef.current.push(timer2);
      
    } catch (error) {
      console.error('❌ 广告列表获取失败:', error);
      setIsLoading(false);
    }
  }, [sendMessage, isLoading]);

  // ✅ 简化的广告切换函数 - 现在主要逻辑在 handleVideoEnded 中
  // 手动切换函数已不再使用，保留逻辑在 handleVideoEnded 内

  // 🛡️ 广告列表变化时的索引安全检查 - 优化：避免不必要的重置
  useEffect(() => {
    if (advertisements.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= advertisements.length) {
      // ✅ 优化：保持在最后一个有效索引，而不是重置为0
      const lastValidIndex = advertisements.length - 1;
      console.log(`🔧 AdCarousel: 索引越界修正 ${currentIndex} -> ${lastValidIndex}`);
      setCurrentIndex(lastValidIndex);
    }
  }, [advertisements.length, currentIndex]);

  // 🚀 统一的广告列表初始化逻辑 - 避免重复请求
  useEffect(() => {
    if (isVisible && isConnectionReady) {
      if (advertisements.length === 0) {
        console.log('🚀 AdCarousel: 连接就绪，开始获取广告列表...');
        // 延迟一点确保MCP服务器完全就绪
        setTimeout(() => {
          fetchAdvertisements();
        }, 500);
      } else if (pendingRefresh) {
        // 🔄 处理待处理的刷新（上传/删除时广告不可见的情况）
        console.log('🔄 AdCarousel: 处理待处理的刷新请求...');
        fetchAdvertisements();
        setPendingRefresh(false);
      }
    }
    // ✅ 移除不必要的重新可见时自动刷新，避免播放中断
    // 但保留待处理刷新的处理逻辑
  }, [isVisible, isConnectionReady, advertisements.length, pendingRefresh]);

  // ✅ 移除定期刷新 - 避免播放中断，只在必要时刷新
  // 广告列表刷新现在只通过以下方式触发：
  // 1. 初始加载时
  // 2. 显示状态变化时  
  // 3. 手动上传/删除广告时（通过事件监听）
  // useEffect(() => {
  //   if (isVisible) {
  //     const refreshInterval = setInterval(() => {
  //       console.log('🔄 AdCarousel: 定期刷新广告列表...');
  //       fetchAdvertisements();
  //     }, 120000); // 2分钟刷新一次
  //
  //     return () => clearInterval(refreshInterval);
  //   }
  //   return undefined;
  // }, [isVisible]);

  // 🔔 监听广告列表变化事件 (来自管理界面的上传/删除操作)
  useEffect(() => {
    const handleAdvertisementChange = (event: CustomEvent) => {
      const { action, filename, trigger } = event.detail || {};
      console.log(`🔔 AdCarousel: 收到广告变化通知 - ${action}: ${filename || '(系统触发)'}`);
      
      if (trigger) {
        console.log(`📝 触发原因: ${trigger}`);
      }
      
      // ✅ 智能处理文件变化刷新
      if (action === 'upload' || action === 'delete') {
        if (isVisible && isConnectionReady) {
          console.log('⚡ AdCarousel: 检测到文件变化，立即刷新广告列表...');
          fetchAdvertisements();
        } else {
          console.log('⏸️ AdCarousel: 文件变化已记录，设置待处理刷新标志');
          setPendingRefresh(true); // 🔄 设置待处理刷新标志
        }
      } else if (action === 'refresh_on_show') {
        console.log('🚫 AdCarousel: 忽略重新显示时的刷新请求，避免播放中断');
      }
    };

    // 添加事件监听器
    window.addEventListener('advertisementListChanged', handleAdvertisementChange as EventListener);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('advertisementListChanged', handleAdvertisementChange as EventListener);
    };
  }, [isVisible, isConnectionReady, fetchAdvertisements]);

  // ✅ 移除自动切换定时器 - 改为视频播放完毕后切换
  useEffect(() => {
    // 清理任何现有的定时器，只依赖视频播放结束事件
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, advertisements.length, currentIndex]);

  // 缓存当前广告对象
  const currentAd = useMemo(() => advertisements[currentIndex], [advertisements, currentIndex]);

  // ✅ 优雅的视频播放管理 - 统一的加载和播放逻辑
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVisible || advertisements.length === 0) return;

    if (!currentAd) return;

    console.log(`▶️ AdCarousel: 准备加载广告 ${currentAd.name} (索引: ${currentIndex})`);
    
    // 构造完整的视频URL
    let videoUrl = currentAd.url_path;
    if (videoUrl.startsWith('/')) {
      videoUrl = baseUrl + videoUrl;
    }
    
    console.log(`📺 视频URL: ${videoUrl}`);
    
    // 🔧 简单直接的播放逻辑 - 在canplay事件触发时播放
    const startPlayback = () => {
      console.log('🎬 AdCarousel: 视频可以播放，开始播放');
      
      if (isAudioMode) {
        // 🎵 有声播放模式
        console.log('🎵 启用有声广告模式');
        
        // 设置音频监听（仅在启用VAD模式时）
        if (enableAudioWithVAD) {
          console.log('+ 智能VAD');
          adAudioMonitor.startMonitoring(video);
        }
        
        // 先尝试有声播放
        video.muted = false;
        video.play().then(() => {
          console.log('✅ 有声广告播放成功');
          // 仅在启用VAD模式时通知后端
          if (enableAudioWithVAD) {
            sendMessage({
              type: 'adaptive-vad-control',
              action: 'start',
              volume: 0.5
            });
          }
        }).catch(err => {
          console.warn('有声播放失败，fallback到静音:', err);
          video.muted = true;
          video.play().catch(mutedErr => {
            console.error('静音播放也失败:', mutedErr);
          });
        });
      } else {
        // 🔇 静音播放模式
        console.log('🔇 使用静音广告模式');
        video.muted = true;
        video.play().catch(err => {
          console.error('静音广告视频播放失败:', err);
        });
      }
    };
    
    const handleLoadedData = () => {
      console.log('✅ AdCarousel: 视频数据加载完成');
    };
    
    const handleError = () => {
      console.error('❌ AdCarousel: 视频加载出错');
    };
    
    // ✅ 清理函数
    const cleanup = () => {
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
    
    // 设置视频源并加载
    video.src = videoUrl;
    video.load();
    
    // 等待视频加载完成后开始播放
    video.addEventListener('canplay', startPlayback, { once: true });
    video.addEventListener('loadeddata', handleLoadedData, { once: true });
    video.addEventListener('error', handleError, { once: true });
    
    // ✅ 返回清理函数
    return cleanup;
  }, [isVisible, currentIndex, advertisements, isAudioMode, enableAudioWithVAD, sendMessage, baseUrl]);

  // 当重新可见时确保重启监控与播放（避免从对话返回后不唤醒）
  useEffect(() => {
    console.log('🔄 AdCarousel VAD状态检查:', { 
      isVisible, 
      isAudioMode, 
      enableAudioWithVAD,
      hasVideo: !!videoRef.current 
    });
    
    if (!isVisible) return;
    const video = videoRef.current;
    if (!video) return;

    if (isAudioMode && enableAudioWithVAD) {
      adAudioMonitor.startMonitoring(video);
      sendMessage({ type: 'adaptive-vad-control', action: 'start', volume: 0.5 });
    }

    // ✅ 使用 ref.current 调用最新的 startMic，避免闭包陷阱
    startMicRef.current().catch((e) => {
      console.error('❌ AdCarousel: 启动本地VAD失败:', e);
      console.error('Stack:', e?.stack);
    });
  }, [isVisible, isAudioMode, enableAudioWithVAD, sendMessage]);

  // ✅ 设置音频监听器 - 使用 ref 避免重复订阅
  const audioInfoRef = useRef(audioInfo);
  useEffect(() => { audioInfoRef.current = audioInfo; }, [audioInfo]);
  
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    if (isAudioMode && enableAudioWithVAD) {
      const handleAudioUpdate = (info: AdAudioInfo) => {
        setAudioInfo(info);
        
        // ✅ 使用 ref 读取最新状态，避免依赖变化导致重新订阅
        if (info.isPlaying !== audioInfoRef.current.isPlaying) {
          sendMessageRef.current({
            type: 'adaptive-vad-control',
            action: info.isPlaying ? 'adjust' : 'reset',
            volume: info.volume
          });
        }
      };

      adAudioMonitor.addCallback(handleAudioUpdate);
      console.log('🎵 AdCarousel: 添加音频监听器');
      
      return () => {
        adAudioMonitor.removeCallback(handleAudioUpdate);
        console.log('🧹 AdCarousel: 移除音频监听器');
      };
    }
    
    // 如果不是音频模式，确保返回undefined
    return undefined;
  }, [isAudioMode, enableAudioWithVAD]); // ✅ 移除变化频繁的依赖

  // ✅ 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      console.log('🧹 AdCarousel: 组件卸载，清理所有资源');
      
      // 清理所有定时器
      timeoutsRef.current.forEach(timer => clearTimeout(timer));
      timeoutsRef.current = [];
      
      // 清理音频监控
      if (isAudioMode && enableAudioWithVAD) {
        adAudioMonitor.stopMonitoring();
        // 通知后端停止自适应VAD
        sendMessage({
          type: 'adaptive-vad-control',
          action: 'stop'
        });
        // 彻底释放音频上下文等资源
        adAudioMonitor.dispose().catch(() => {});
      }
    };
  }, [isAudioMode, enableAudioWithVAD, sendMessage]);

  // ✅ 音频模式切换功能已移至控制面板
  // const toggleAudioMode = () => {
  //   const newMode = !isAudioMode;
  //   setIsAudioMode(newMode);
  //   
  //   if (newMode) {
  //     console.log('🎵 切换到有声广告模式');
  //     if (enableAudioWithVAD) {
  //       console.log('+ 智能VAD支持');
  //     }
  //   } else {
  //     console.log('🔇 切换到静音广告模式');
  //     if (enableAudioWithVAD) {
  //       adAudioMonitor.stopMonitoring();
  //       sendMessage({
  //         type: 'adaptive-vad-control',
  //         action: 'stop'
  //       });
  //     }
  //   }
  //   
  //   // 重新加载当前视频以应用新的音频设置
  //   if (videoRef.current && advertisements.length > 0) {
  //     const video = videoRef.current;
  //     const currentTime = video.currentTime;
  //     video.load();
  //     video.currentTime = currentTime;
  //   }
  // };

  // 🔧 简单有效的视频结束处理 - 只负责切换索引
  const handleVideoEnded = useCallback(() => {
    console.log('📺 AdCarousel: 视频播放结束');
    console.log(`📊 当前状态: 索引${currentIndex}/${advertisements.length}, 可见:${isVisible}`);
    
    // 清理音频监听
    if (isAudioMode && enableAudioWithVAD) {
      adAudioMonitor.stopMonitoring();
    }
    
    if (advertisements.length === 1) {
      // 只有一个广告时，重新播放同一个广告
      console.log('🔄 AdCarousel: 只有一个广告，重新播放');
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(err => {
          console.error('重新播放广告失败:', err);
        });
      }
    } else {
      // 多个广告时，只更新索引，让 useEffect 处理播放
      const nextIndex = (currentIndex + 1) % advertisements.length;
      const isLooping = nextIndex === 0;
      
      if (isLooping) {
        console.log('🔄 AdCarousel: 完成一轮播放，开始新的循环');
      }
      
      console.log(`➡️ AdCarousel: 切换到下一个广告 ${currentIndex} -> ${nextIndex}`);
      setCurrentIndex(nextIndex);
      // 不要在这里手动播放！让 useEffect 来处理
    }
  }, [currentIndex, advertisements.length, isVisible, isAudioMode, enableAudioWithVAD]);

  // 视频加载错误处理
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    console.error('広告動画の読み込み失敗:', video.src, video.error);
  };

  if (!isVisible) {
    return null;
  }

  // ✅ currentAd 变量已不需要，因为移除了叠加层显示

  return (
    <div className="ad-carousel-overlay" style={{ pointerEvents: 'none' }}>
      {isLoading ? (
        <div className="ad-loading">
          <div className="loading-spinner"></div>
          <p>広告コンテンツを読み込み中...</p>
        </div>
      ) : advertisements.length === 0 ? (
        <div className="ad-empty">
          <div className="empty-placeholder">
            <h2>🎬 広告カルーセルシステム</h2>
            <p>広告コンテンツがありません</p>
            <p>ads/ フォルダに動画ファイルを追加してください</p>
            <small>対応形式: MP4, AVI, MOV, WebM, MKV</small>
          </div>
        </div>
      ) : (
    <div className="ad-player-container" style={{ pointerEvents: 'none' }}>
          <video
            ref={videoRef}
            className="ad-video"
            crossOrigin="anonymous"
            autoPlay
            loop={false}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            onLoadStart={undefined}
            onCanPlay={undefined}
            onPlay={undefined}
            onPause={undefined}
            onTimeUpdate={undefined}
            style={{ objectFit: fitMode, backgroundColor: '#000', pointerEvents: 'none' }}
            controls={false}
          >
            您的浏览器不支持视频播放。
          </video>
          
          {/* ✅ 纯净播放 - 移除所有叠加层遮挡 */}
        </div>
      )}

      <style>{`
        .ad-carousel-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: transparent; /* 由父级 #viewport 控制背景 */
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ad-loading {
          text-align: center;
          color: white;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ad-empty {
          text-align: center;
          color: white;
          padding: 40px;
        }

        .empty-placeholder h2 {
          margin-bottom: 20px;
          font-size: 2em;
        }

        .empty-placeholder p {
          margin: 10px 0;
          font-size: 1.2em;
        }

        .empty-placeholder small {
          opacity: 0.7;
          font-size: 0.9em;
        }

        .ad-player-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000; /* 适配 contain/scale-down 时的信箱黑边 */
        }

        .ad-video {
          width: 100%;
          height: 100%;
          object-fit: initial; /* 由行内 style 控制 fit 模式 */
        }

        /* ✅ 移除所有叠加层样式 - 实现纯净播放体验 */


      `}</style>
    </div>
  );
});