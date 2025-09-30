import { useState, useEffect, useCallback } from 'react';
import { resourceManager, Resource } from '@/utils/resource-manager';

/**
 * React Hook 用于自动注册和清理资源
 */
export const useResourceManager = () => {
  const [registeredResources] = useState<string[]>([]);

  // 组件卸载时清理所有注册的资源
  useEffect(() => {
    return () => {
      registeredResources.forEach(resourceId => {
        resourceManager.cleanup(resourceId);
      });
    };
  }, [registeredResources]);

  const register = useCallback((resource: Omit<Resource, 'createdAt'>) => {
    const id = resourceManager.register(resource);
    registeredResources.push(id);
    return id;
  }, [registeredResources]);

  const cleanup = useCallback((resourceId: string) => {
    const index = registeredResources.indexOf(resourceId);
    if (index > -1) {
      registeredResources.splice(index, 1);
    }
    return resourceManager.cleanup(resourceId);
  }, [registeredResources]);

  return {
    register,
    cleanup,
    registerAudioContext: resourceManager.registerAudioContext.bind(resourceManager),
    registerWebSocket: resourceManager.registerWebSocket.bind(resourceManager),
    registerEventListener: resourceManager.registerEventListener.bind(resourceManager),
    registerInterval: resourceManager.registerInterval.bind(resourceManager),
    registerTimeout: resourceManager.registerTimeout.bind(resourceManager),
    registerPixiApp: resourceManager.registerPixiApp.bind(resourceManager),
    registerMediaStream: resourceManager.registerMediaStream.bind(resourceManager),
    registerObserver: resourceManager.registerObserver.bind(resourceManager),
    getStats: resourceManager.getResourceStats.bind(resourceManager),
  };
};