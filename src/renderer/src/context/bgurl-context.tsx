import {
  createContext, useMemo, useContext, useCallback,
} from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { useWebSocket } from './websocket-context';
import { useMediaStore } from '@/store';

/**
 * Background file interface
 * @interface BackgroundFile
 */
type BackgroundFile = { name: string; url?: string; filename?: string } | string;

/**
 * Background URL context state interface
 * @interface BgUrlContextState
 */
export interface BgUrlContextState {
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  backgroundFiles: BackgroundFile[];
  setBackgroundFiles: (files: BackgroundFile[]) => void;
  resetBackground: () => void;
  addBackgroundFile: (file: BackgroundFile) => void;
  removeBackgroundFile: (name: string) => void;
  isDefaultBackground: boolean;
  useCameraBackground: boolean;
  setUseCameraBackground: (use: boolean) => void;
}

/**
 * Create the background URL context
 */
const BgUrlContext = createContext<BgUrlContextState | null>(null);

/**
 * Background URL Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function BgUrlProvider({ children }: { children: React.ReactNode }) {
  const { baseUrl } = useWebSocket();
  const DEFAULT_BACKGROUND = `${baseUrl}/bg/ceiling-window-room-night.jpeg`;

  // Local storage for persistent background URL
  const [backgroundUrl, setBackgroundUrl] = useLocalStorage<string>(
    'backgroundUrl',
    DEFAULT_BACKGROUND,
  );

  const {
    backgroundFiles,
    setBackgroundFiles,
    useCameraBackground,
    setUseCameraBackground,
  } = useMediaStore();

  // Reset background to default
  const resetBackground = useCallback(() => {
    setBackgroundUrl(DEFAULT_BACKGROUND);
  }, [setBackgroundUrl, DEFAULT_BACKGROUND]);

  // Add new background file
  const addBackgroundFile = useCallback((file: BackgroundFile) => {
    const list = Array.isArray(backgroundFiles) ? backgroundFiles : [];
    setBackgroundFiles([...(list as BackgroundFile[]), file]);
  }, [backgroundFiles, setBackgroundFiles]);

  // Remove background file
  const removeBackgroundFile = useCallback((name: string) => {
    const list = Array.isArray(backgroundFiles) ? backgroundFiles : [];
    const next = (list as BackgroundFile[]).filter((file) => {
      if (typeof file === 'string') return file !== name;
      return file.name !== name && file.filename !== name;
    });
    setBackgroundFiles(next);
  }, [backgroundFiles, setBackgroundFiles]);

  // Check if current background is default
  const isDefaultBackground = useMemo(
    () => backgroundUrl === DEFAULT_BACKGROUND,
    [backgroundUrl, DEFAULT_BACKGROUND],
  );

  // Memoized context value
  const contextValue = useMemo(() => ({
    backgroundUrl,
    setBackgroundUrl,
    backgroundFiles,
    setBackgroundFiles,
    resetBackground,
    addBackgroundFile,
    removeBackgroundFile,
    isDefaultBackground,
    useCameraBackground,
    setUseCameraBackground,
  }), [backgroundUrl, setBackgroundUrl, backgroundFiles, resetBackground, addBackgroundFile, removeBackgroundFile, isDefaultBackground, useCameraBackground, setUseCameraBackground, setBackgroundFiles]);

  return (
    <BgUrlContext.Provider value={contextValue}>
      {children}
    </BgUrlContext.Provider>
  );
}

/**
 * Custom hook to use the background URL context
 * @throws {Error} If used outside of BgUrlProvider
 */
// ✅ 修复：使用箭头函数导出，符合 Fast Refresh 规范
export const useBgUrl = () => {
  const context = useContext(BgUrlContext);

  if (!context) {
    throw new Error('useBgUrl must be used within a BgUrlProvider');
  }

  return context;
};
