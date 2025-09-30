// [LEGACY] LaundryContext migrated to Zustand. Kept for reference; scheduled for removal.
// import React, { createContext, useContext, useState, ReactNode } from 'react';
//
// export interface MachineInfo {
//   id: string;
//   name: string;
//   videoPath: string;
//   available: boolean;
// }
//
// export interface LaundryContextType {
//   isLaundryMode: boolean;
//   setIsLaundryMode: (enabled: boolean) => void;
//   currentVideo: string | null;
//   videoTitle: string;
//   isVideoPlaying: boolean;
//   setCurrentVideo: (videoPath: string | null, title?: string) => void;
//   availableMachines: MachineInfo[];
//   setAvailableMachines: (machines: MachineInfo[]) => void;
//   isIdle: boolean;
//   setIsIdle: (idle: boolean) => void;
//   idleTimeout: number;
//   setIdleTimeout: (timeout: number) => void;
//   autoCloseEnabled: boolean;
//   setAutoCloseEnabled: (enabled: boolean) => void;
//   autoCloseDelay: number;
//   setAutoCloseDelay: (delay: number) => void;
// }
//
// const LaundryContext = createContext<LaundryContextType | undefined>(undefined);
//
// export const useLaundry = (): LaundryContextType => {
//   const context = useContext(LaundryContext);
//   if (!context) {
//     throw new Error('useLaundry must be used within a LaundryProvider');
//   }
//   return context;
// };
//
// interface LaundryProviderProps {
//   children: ReactNode;
// }
//
// export const LaundryProvider: React.FC<LaundryProviderProps> = ({ children }) => {
//   const [isLaundryMode, setIsLaundryMode] = useState(false);
//   const [currentVideo, setCurrentVideoState] = useState<string | null>(null);
//   const [videoTitle, setVideoTitle] = useState('');
//   const [isVideoPlaying, setIsVideoPlaying] = useState(false);
//   const [availableMachines, setAvailableMachines] = useState<MachineInfo[]>([]);
//   const [isIdle, setIsIdle] = useState(false);
//   const [idleTimeout, setIdleTimeout] = useState(60000);
//   const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
//   const [autoCloseDelay, setAutoCloseDelay] = useState(3000);
//
//   const setCurrentVideo = (videoPath: string | null, title: string = '使用教程') => {
//     setCurrentVideoState(videoPath);
//     setVideoTitle(title);
//     setIsVideoPlaying(!!videoPath);
//   };
//
//   const contextValue: LaundryContextType = {
//     isLaundryMode,
//     setIsLaundryMode,
//     currentVideo,
//     videoTitle,
//     isVideoPlaying,
//     setCurrentVideo,
//     availableMachines,
//     setAvailableMachines,
//     isIdle,
//     setIsIdle,
//     idleTimeout,
//     setIdleTimeout,
//     autoCloseEnabled,
//     setAutoCloseEnabled,
//     autoCloseDelay,
//     setAutoCloseDelay,
//   };
//
//   return (
//     <LaundryContext.Provider value={contextValue}>
//       {children}
//     </LaundryContext.Provider>
//   );
// };
//
// export default LaundryProvider;