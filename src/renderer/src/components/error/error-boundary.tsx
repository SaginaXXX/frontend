import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获React组件树中的所有错误，防止应用崩溃
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('🚨 React Error Boundary捕获到错误:', error);
    console.error('📍 错误详细信息:', errorInfo);
    
    // 更新状态包含错误信息
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: 发送错误报告到监控系统
    this.reportError(error, errorInfo);
  }

  /**
   * 报告错误到监控系统
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // 构造错误报告
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 发送到监控服务（例如 Sentry）
    try {
      // window.Sentry?.captureException(error, {
      //   extra: errorReport,
      // });
      console.warn('📊 错误报告已记录:', errorReport);
    } catch (reportingError) {
      console.error('❌ 错误报告发送失败:', reportingError);
    }
  }

  /**
   * 重置错误状态，尝试恢复
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * 刷新整个应用
   */
  private handleRefresh = () => {
    window.location.reload();
  };

  /**
   * 返回主页
   */
  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
          p={8}
        >
          <VStack spacing={6} maxW="md" textAlign="center">
            <Box color="red.500" fontSize="5xl">
              <FiAlertTriangle />
            </Box>
            
            <VStack spacing={3}>
              <Heading size="lg" color="gray.800">
                应用遇到了问题
              </Heading>
              <Text color="gray.600" fontSize="md">
                很抱歉，应用发生了意外错误。请尝试以下解决方案：
              </Text>
            </VStack>

            <HStack spacing={4}>
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="blue"
                onClick={this.handleReset}
                size="md"
              >
                重试
              </Button>
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={this.handleRefresh}
                size="md"
              >
                刷新页面
              </Button>
              <Button
                leftIcon={<FiHome />}
                variant="ghost"
                onClick={this.handleGoHome}
                size="md"
              >
                返回主页
              </Button>
            </HStack>

            {/* 开发环境显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                mt={6}
                p={4}
                bg="gray.100"
                borderRadius="md"
                width="100%"
                maxH="200px"
                overflowY="auto"
              >
                <Text fontSize="sm" fontFamily="mono" color="red.600" mb={2}>
                  <strong>错误信息:</strong> {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text fontSize="xs" fontFamily="mono" color="gray.600" whiteSpace="pre-wrap">
                    {this.state.error.stack}
                  </Text>
                )}
              </Box>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * 简化的错误边界Hook版本
 * 用于函数组件中的局部错误边界
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`🚨 ${context || '应用错误'}:`, error);
    
    // TODO: 发送到监控系统
    try {
      // window.Sentry?.captureException(error, {
      //   tags: { context },
      // });
    } catch (reportingError) {
      console.error('❌ 错误报告发送失败:', reportingError);
    }
  }, []);

  return { handleError };
};