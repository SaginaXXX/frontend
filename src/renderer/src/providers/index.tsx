/**
 * Provider 组合器（为何重要）
 *
 * 作用：集中装配全局 Provider 与依赖顺序，提供稳定、可维护的“应用外壳”。
 * - 与 Zustand 并不冲突：Zustand 负责数据源，这里负责“设备/模型/桥接/错误边界”等全局设施。
 * - 关键顺序保证：
 *   Live2DModelProvider → CameraProvider → ScreenCaptureProvider → CharacterConfigProvider →
 *   ChatHistoryProvider → ProactiveSpeakProvider → Live2DConfigProvider → VADProvider →
 *   BgUrlProvider → GroupProvider → WebSocketHandler（必须最后）
 *
 * 为何 WebSocketHandler 放最后：
 * - 它在接收后端消息后，会调用前面 Provider 暴露的 API（或其适配层对接到 Zustand 的动作）。
 * - 如果顺序错误，会出现“Provider 未就绪/找不到上下文/副作用回写时机混乱”等问题。
 *
 * 迁移后的现状：
 * - 旧的 Context 状态已迁至 Zustand，仍保留少量“适配层 Provider”（bgurl/chat-history/group）用于对外 API 与 UI 兼容。
 * - 这个文件确保全局 ErrorBoundary、Chakra UI 主题、以及设备/模型/VAD/桥接能力在任何页面都可用。
 */

import React, { ReactNode, Component, ErrorInfo } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { errorHandler } from '@/utils/error-handler';

// =========================
// 简单错误边界（用于捕获ChakraProvider初始化错误）
// =========================

interface SimpleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SimpleErrorBoundary extends Component<
  { children: ReactNode },
  SimpleErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SimpleErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 外层错误边界捕获到错误:', error, errorInfo);
    errorHandler.handleError({
      type: 'unknown' as any,
      message: error.message,
      originalError: error,
      context: 'Outer Error Boundary (ChakraProvider initialization)',
      timestamp: Date.now(),
      recoverable: false,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f7fafc',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ fontSize: '3rem', color: '#e53e3e', marginBottom: '1rem' }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: '1.5rem', color: '#2d3748', marginBottom: '1rem' }}>
              应用初始化失败
            </h1>
            <p style={{ color: '#718096', marginBottom: '2rem' }}>
              很抱歉，应用在初始化时遇到了问题。请刷新页面重试。
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              刷新页面
            </button>
            {this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#718096' }}>
                  错误详情
                </summary>
                <pre
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#edf2f7',
                    borderRadius: '0.375rem',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    color: '#c53030',
                  }}
                >
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =========================
// 核心Provider层 - 基础设施
// =========================

interface CoreProvidersProps {
  children: ReactNode;
}

export const CoreProviders: React.FC<CoreProvidersProps> = ({ children }) => {
  // 全局错误处理
  const handleGlobalError = (error: Error, errorInfo: any) => {
    console.error('🚨 全局React错误:', error, errorInfo);
    errorHandler.handleError({
      type: 'unknown' as any,
      message: error.message,
      originalError: error,
      context: 'React Component Tree',
      timestamp: Date.now(),
      recoverable: false,
    });
  };

  return (
    <SimpleErrorBoundary>
      <ChakraProvider value={defaultSystem}>
        <ErrorBoundary onError={handleGlobalError}>
          <Toaster />
          {children}
        </ErrorBoundary>
      </ChakraProvider>
    </SimpleErrorBoundary>
  );
};

// =========================
// 服务Provider层 - 核心服务
// =========================

// WebSocketHandler 需放在所有 Context Provider 之后以确保依赖顺序正确

interface ServiceProvidersProps {
  children: ReactNode;
}

export const ServiceProviders: React.FC<ServiceProvidersProps> = ({ children }) => {
  // 现在只是一个传递层，未来可以在这里添加其他不依赖Context的服务
  return <>{children}</>;
};

// =========================
// 功能Provider层 - 业务功能
// =========================

// 将剩余的Context合并到几个关键的Provider中

interface FeatureProvidersProps {
  children: ReactNode;
}

export const FeatureProviders: React.FC<FeatureProvidersProps> = ({ children }) => {
  return (
    <>{children}</>
  );
};

// =========================
// 统一Provider组合器
// =========================

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <CoreProviders>
      <ServiceProviders>
        <FeatureProviders>
          {/* Non-legacy functional provider chain (no AiState/Subtitle) */}
          <Live2DModelProvider>
            <CameraProvider>
              <ScreenCaptureProvider>
                <CharacterConfigProvider>
                  <ChatHistoryProvider>
                    <ProactiveSpeakTimer>
                      <VADProvider>
                          <BgUrlProvider>
                            <GroupProvider>
                              {/* WebSocketHandler 必须在所有Context Provider之后 */}
                              <WebSocketHandler>
                                {children}
                              </WebSocketHandler>
                            </GroupProvider>
                          </BgUrlProvider>
                        </VADProvider>
                    </ProactiveSpeakTimer>
                  </ChatHistoryProvider>
                </CharacterConfigProvider>
              </ScreenCaptureProvider>
            </CameraProvider>
          </Live2DModelProvider>
        </FeatureProviders>
      </ServiceProviders>
    </CoreProviders>
  );
};

// ============== Provider依赖导入（供 AppProviders 使用） ==============
import { BgUrlProvider } from '@/context/bgurl-context';
import { CameraProvider } from '@/context/camera-context';
import { ChatHistoryProvider } from '@/context/chat-history-context';
import { CharacterConfigProvider } from '@/context/character-config-context';
import { VADProvider } from '@/context/vad-context';
import { Live2DModelProvider } from '@/context/live2d-model-context';
import { ProactiveSpeakTimer } from '@/components/providers/proactive-speak-timer';
import { ScreenCaptureProvider } from '@/context/screen-capture-context';
import { GroupProvider } from '@/context/group-context';
import WebSocketHandler from '@/services/websocket-handler';

// =========================
// Provider性能监控
// =========================

/**
 * 性能监控Provider包装器
 */
export const withPerformanceMonitoring = <P extends {}>(
  WrappedProvider: React.ComponentType<P>,
  name: string
) => {
  return React.memo((props: P) => {
    React.useEffect(() => {
      console.log(`📊 Provider性能监控: ${name} 已挂载`);
      
      return () => {
        console.log(`📊 Provider性能监控: ${name} 已卸载`);
      };
    }, []);

    return <WrappedProvider {...props} />;
  });
};

// 使用示例：
// export const MonitoredCoreProviders = withPerformanceMonitoring(CoreProviders, 'CoreProviders');

// =========================
// 开发工具Provider
// =========================

interface DevProvidersProps {
  children: ReactNode;
  enableDevTools?: boolean;
}

export const DevProviders: React.FC<DevProvidersProps> = ({ 
  children, 
  enableDevTools = process.env.NODE_ENV === 'development' 
}) => {
  if (!enableDevTools) {
    return <>{children}</>;
  }

  return (
    <div data-dev-providers="true">
      {/* 开发环境专用的Provider */}
      {children}
      
      {/* 开发工具面板 */}
      {enableDevTools && (
        <div 
          style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
          }}
        >
          🔧 开发模式
        </div>
      )}
    </div>
  );
};

export default AppProviders;