import {
  createContext, useContext, useMemo, useEffect, useCallback,
} from 'react';
import { useAppStore, ConfigFile } from '@/store';

/**
 * 导出 ConfigFile 类型（向后兼容）
 */
export type { ConfigFile };

/**
 * Character configuration context state interface
 * @interface CharacterConfigState
 */
interface CharacterConfigState {
  confName: string;
  confUid: string;
  configFiles: ConfigFile[];
  setConfName: (name: string) => void;
  setConfUid: (uid: string) => void;
  setConfigFiles: (files: ConfigFile[]) => void;
  getFilenameByName: (name: string) => string | undefined;
}

/**
 * Create the character configuration context
 */
export const ConfigContext = createContext<CharacterConfigState | null>(null);

// ✅ 稳定的默认值引用（避免每次创建新数组导致无限循环）
const EMPTY_CONFIG_FILES: ConfigFile[] = [];

/**
 * Character Configuration Provider Component
 * ✅ 重构后：从 Store 读取所有状态，Context 只作为适配层
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function CharacterConfigProvider({ children }: { children: React.ReactNode }) {
  // ✅ 使用稳定的常量作为默认值（避免每次创建新数组引用）
  const confName = useAppStore((s) => s.config?.character?.confName ?? '');
  const confUid = useAppStore((s) => s.config?.character?.confUid ?? '');
  const configFiles = useAppStore((s) => s.config?.character?.configFiles ?? EMPTY_CONFIG_FILES);
  
  // ✅ Actions 是稳定的引用（不需要放入依赖数组）
  const setConfName = useAppStore((s) => s.setCharacterConfName);
  const setConfUid = useAppStore((s) => s.setCharacterConfUid);
  const setConfigFiles = useAppStore((s) => s.setCharacterConfigFiles);

  // ✅ 唯一的辅助方法（不适合放在 Store 中）
  const getFilenameByName = useCallback(
    (name: string) => configFiles.find((config) => config.name === name)?.filename,
    [configFiles],
  );

  // ✅ Electron IPC 同步副作用
  useEffect(() => {
    (window.api as any)?.updateConfigFiles?.(configFiles);
  }, [configFiles]);

  // Memoized context value - 注意：actions 不应放入依赖数组（它们是稳定引用）
  const contextValue = useMemo(
    () => ({
      confName,
      confUid,
      configFiles,
      setConfName,
      setConfUid,
      setConfigFiles,
      getFilenameByName,
    }),
    [confName, confUid, configFiles, getFilenameByName],
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Custom hook to use the character configuration context
 * @throws {Error} If used outside of CharacterConfigProvider
 */
export const useConfig = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error('useConfig must be used within a CharacterConfigProvider');
  }

  return context;
}
