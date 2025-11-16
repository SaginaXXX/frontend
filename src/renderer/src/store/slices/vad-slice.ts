/**
 * VAD (Voice Activity Detection) 状态 Slice
 * 管理麦克风和语音检测相关设置
 */

import { StateCreator } from 'zustand';
import { VADState } from '../types';
import { initialVADState } from '../initial-states';

export interface VADSlice {
  vad: VADState;
  updateVADSettings: (settings: Partial<VADState['settings']>) => void;
  setMicState: (micOn: boolean) => void;
  setAutoStopMic: (value: boolean) => void;
  setAutoStartMicOn: (value: boolean) => void;
  setAutoStartMicOnConvEnd: (value: boolean) => void;
}

export const createVADSlice: StateCreator<
  VADSlice,
  [['zustand/immer', never]]
> = (set) => ({
  vad: initialVADState,

  updateVADSettings: (settings) => {
    set((draft) => {
      Object.assign(draft.vad.settings, settings);
    });
  },

  setMicState: (micOn) => {
    set((draft) => {
      draft.vad.micOn = micOn;
    });
  },

  setAutoStopMic: (value) => {
    set((draft) => {
      draft.vad.autoStopMic = value;
    });
  },

  setAutoStartMicOn: (value) => {
    set((draft) => {
      draft.vad.autoStartMicOn = value;
    });
  },

  setAutoStartMicOnConvEnd: (value) => {
    set((draft) => {
      draft.vad.autoStartMicOnConvEnd = value;
    });
  },
});

