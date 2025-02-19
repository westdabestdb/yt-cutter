import { create } from 'zustand';

interface VideoState {
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  isProcessing: boolean;
  setUrl: (url: string) => void;
  setStartTime: (time: number) => void;
  setEndTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  url: '',
  startTime: 0,
  endTime: 0,
  duration: 0,
  isProcessing: false,
  setUrl: (url) => set({ url }),
  setStartTime: (startTime) => set({ startTime }),
  setEndTime: (endTime) => set({ endTime }),
  setDuration: (duration) => set({ duration }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  reset: () => set({
    url: '',
    startTime: 0,
    endTime: 0,
    duration: 0,
    isProcessing: false,
  }),
})); 