import { ReactNode } from 'react';
import { useProactiveSpeakTimer } from '@/hooks/utils/use-proactive-speak-timer';

/**
 * Proactive Speak Timer Provider
 * Manages idle timer for proactive speaking feature
 * This is a service provider that monitors AI state and triggers proactive speak
 */
interface ProactiveSpeakTimerProps {
  children: ReactNode;
}

export function ProactiveSpeakTimer({ children }: ProactiveSpeakTimerProps) {
  // Initialize proactive speak timer logic
  useProactiveSpeakTimer();
  
  return <>{children}</>;
}

