/**
 * Suspense包装器 - 统一懒加载组件的加载状态管理
 */

import React, { Suspense, ComponentType } from 'react';
import { LoadingSpinner } from './loading-spinner';
import { errorHandler } from '@/utils/error-handler';

interface SuspenseWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  errorBoundary?: boolean;
}

interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * 基础Suspense包装器
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner />,
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

/**
 * 高阶组件：为懒加载组件添加Suspense和错误处理
 */
export function withLazySuspense<P extends object>(
  LazyComponent: ComponentType<P>,
  options: LazyComponentWrapperProps = {}
) {
  const WrappedComponent: React.FC<P> = (props) => {
    const handleError = (error: Error) => {
      console.error('懒加载组件加载失败:', error);
      errorHandler.handleError({
        type: 'unknown' as any,
        message: `Lazy component loading failed: ${error.message}`,
        originalError: error,
        context: 'Lazy Loading',
        timestamp: Date.now(),
        recoverable: true,
      });
      
      if (options.onError) {
        options.onError(error);
      }
    };

    // 包装错误边界
    class LazyErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
      }

      componentDidCatch(error: Error) {
        handleError(error);
      }

      render() {
        if (this.state.hasError) {
          return (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#999',
              fontSize: '14px' 
            }}>
              组件加载失败，请刷新重试
            </div>
          );
        }

        return this.props.children;
      }
    }

    return (
      <LazyErrorBoundary>
        <SuspenseWrapper fallback={options.fallback}>
          <LazyComponent {...props} />
        </SuspenseWrapper>
      </LazyErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withLazySuspense(${LazyComponent.displayName || LazyComponent.name})`;
  
  return WrappedComponent;
}

/**
 * 预设的懒加载包装器
 */
export const LazyComponentWrapper: React.FC<{ 
  children: React.ReactNode;
  name?: string;
}> = ({ children, name }) => (
  <SuspenseWrapper 
    fallback={
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        width: '100%',
        gap: '8px'
      }}>
        <LoadingSpinner />
        {name && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            加载{name}中...
          </div>
        )}
      </div>
    }
  >
    {children}
  </SuspenseWrapper>
);