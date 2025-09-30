/**
 * 性能监控面板 - 实时显示应用性能指标
 * 包括资源使用、网络性能、组件渲染等
 */

import React, { useState, useEffect, memo } from 'react';
import { Box, VStack, HStack, Text, Progress, Badge, Button } from '@chakra-ui/react';
import { resourceManager } from '@/utils/resource-manager';
import { networkManager } from '@/utils/network-performance';

interface PerformanceData {
  resources: {
    total: number;
    memoryKB: number;
    leaks: number;
    recommendations: string[];
  };
  network: {
    totalRequests: number;
    cacheHitRate: number;
    failedRequests: number;
    pendingRequests: number;
  };
  browser: {
    memoryUsedMB: number;
    memoryLimitMB: number;
    memoryUsage: number;
  };
  renderMetrics: {
    componentsRendered: number;
    avgRenderTime: number;
  };
}

export const PerformanceMonitor: React.FC<{ 
  isVisible?: boolean;
  onClose?: () => void;
}> = memo(({ isVisible = true, onClose }) => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isVisible || !autoRefresh) return;

    const updateData = async () => {
      try {
        // 获取资源管理器数据
        const resourceReport = resourceManager.getPerformanceReport();
        
        // 获取网络管理器数据
        const networkStats = networkManager.getNetworkStats();
        
        // 获取浏览器内存信息
        const memoryInfo = (performance as any).memory || {};
        const memoryUsedMB = (memoryInfo.usedJSHeapSize || 0) / 1024 / 1024;
        const memoryLimitMB = (memoryInfo.jsHeapSizeLimit || 0) / 1024 / 1024;
        
        setData({
          resources: {
            total: resourceReport.totalResources,
            memoryKB: resourceReport.estimatedMemoryKB,
            leaks: resourceReport.leakedResources.length,
            recommendations: resourceReport.recommendations,
          },
          network: {
            totalRequests: networkStats.requests.totalRequests,
            cacheHitRate: networkStats.cache.hitRate,
            failedRequests: networkStats.requests.failedRequests,
            pendingRequests: networkStats.pendingRequests,
          },
          browser: {
            memoryUsedMB,
            memoryLimitMB,
            memoryUsage: memoryLimitMB > 0 ? (memoryUsedMB / memoryLimitMB) * 100 : 0,
          },
          renderMetrics: {
            componentsRendered: 0, // TODO: 实现组件渲染统计
            avgRenderTime: 0,
          },
        });
      } catch (error) {
        console.error('性能数据获取失败:', error);
      }
    };

    updateData();
    const interval = setInterval(updateData, 2000); // 每2秒更新

    return () => clearInterval(interval);
  }, [isVisible, autoRefresh]);

  if (!isVisible || !data) return null;

  const getHealthColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'green';
    if (value < thresholds[1]) return 'yellow';
    return 'red';
  };

  return (
    <Box
      position="fixed"
      top="20px"
      right="20px"
      width="320px"
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      p={4}
      fontSize="sm"
      zIndex={9999}
      border="1px solid #e2e8f0"
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" color="gray.700">🚀 性能监控</Text>
        <HStack>
          <Button
            size="xs"
            variant={autoRefresh ? "solid" : "outline"}
            colorScheme={autoRefresh ? "blue" : "gray"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "⏸️" : "▶️"}
          </Button>
          {onClose && (
            <Button size="xs" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </HStack>
      </HStack>

      <VStack spacing={3} align="stretch">
        {/* 资源管理 */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontWeight="semibold">📦 资源管理</Text>
            <Badge 
              colorScheme={getHealthColor(data.resources.total, [50, 100])}
              variant="subtle"
            >
              {data.resources.total} 个资源
            </Badge>
          </HStack>
          
          <VStack spacing={1} align="stretch" fontSize="xs">
            <HStack justify="space-between">
              <Text>内存估算:</Text>
              <Text color={getHealthColor(data.resources.memoryKB, [10000, 50000])}>
                {(data.resources.memoryKB / 1024).toFixed(1)} MB
              </Text>
            </HStack>
            
            {data.resources.leaks > 0 && (
              <HStack justify="space-between">
                <Text color="red.500">🚨 疑似泄漏:</Text>
                <Badge colorScheme="red" size="sm">{data.resources.leaks}</Badge>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* 网络性能 */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontWeight="semibold">🌐 网络性能</Text>
            <Badge 
              colorScheme={getHealthColor(100 - data.network.cacheHitRate, [20, 50])}
              variant="subtle"
            >
              {data.network.cacheHitRate.toFixed(1)}% 命中率
            </Badge>
          </HStack>
          
          <VStack spacing={1} align="stretch" fontSize="xs">
            <HStack justify="space-between">
              <Text>总请求:</Text>
              <Text>{data.network.totalRequests}</Text>
            </HStack>
            
            <HStack justify="space-between">
              <Text>失败请求:</Text>
              <Text color={data.network.failedRequests > 0 ? "red.500" : "gray.600"}>
                {data.network.failedRequests}
              </Text>
            </HStack>
            
            {data.network.pendingRequests > 0 && (
              <HStack justify="space-between">
                <Text>进行中:</Text>
                <Badge colorScheme="blue" size="sm">{data.network.pendingRequests}</Badge>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* 浏览器内存 */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontWeight="semibold">🧠 浏览器内存</Text>
            <Badge 
              colorScheme={getHealthColor(data.browser.memoryUsage, [60, 80])}
              variant="subtle"
            >
              {data.browser.memoryUsage.toFixed(1)}%
            </Badge>
          </HStack>
          
          <VStack spacing={1} align="stretch">
            <Progress 
              value={data.browser.memoryUsage} 
              colorScheme={getHealthColor(data.browser.memoryUsage, [60, 80])}
              size="sm"
            />
            <HStack justify="space-between" fontSize="xs">
              <Text>{data.browser.memoryUsedMB.toFixed(1)} MB</Text>
              <Text color="gray.500">/ {data.browser.memoryLimitMB.toFixed(0)} MB</Text>
            </HStack>
          </VStack>
        </Box>

        {/* 优化建议 */}
        {data.resources.recommendations.length > 0 && (
          <Box>
            <Text fontWeight="semibold" mb={1} color="orange.600">💡 优化建议</Text>
            <VStack spacing={1} align="stretch">
              {data.resources.recommendations.slice(0, 2).map((rec, idx) => (
                <Text key={idx} fontSize="xs" color="orange.600" pl={2}>
                  • {rec}
                </Text>
              ))}
            </VStack>
          </Box>
        )}

        {/* 快捷操作 */}
        <HStack spacing={2}>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              resourceManager.cleanupByType(resourceManager.ResourceType.TIMEOUT);
              resourceManager.cleanupByType(resourceManager.ResourceType.INTERVAL);
            }}
          >
            🧹 清理定时器
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => networkManager.clearCache()}
          >
            🗑️ 清除缓存
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';