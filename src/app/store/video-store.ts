import { create } from 'zustand';
import { extractVideoId } from '../lib/validations/youtube';

interface VideoState {
  url: string;
  platform: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  isProcessing: boolean;
  exportError: string | null;
  estimatedSize: { video: string | null; audio: string | null };
  setUrl: (url: string) => void;
  setStartTime: (time: number) => void;
  setEndTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  updateSizeEstimate: () => void;
  exportVideo: (format: 'video' | 'audio') => Promise<void>;
  reset: () => void;
}

// Debounce helper
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const useVideoStore = create<VideoState>((set, get) => {
  // Create a debounced version of the size estimation
  const debouncedEstimate = debounce(async () => {
    const state = get();
    if (!state.url || state.startTime === state.endTime || !state.duration) {
      set({ estimatedSize: { video: null, audio: null } });
      return;
    }

    try {
      const [videoEstimate, audioEstimate] = await Promise.all([
        fetch('/api/size-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: state.url,
            startTime: state.startTime,
            endTime: state.endTime,
            format: 'video',
          }),
        }).then(res => res.json()),
        fetch('/api/size-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: state.url,
            startTime: state.startTime,
            endTime: state.endTime,
            format: 'audio',
          }),
        }).then(res => res.json()),
      ]);

      set({
        estimatedSize: {
          video: videoEstimate.size,
          audio: audioEstimate.size,
        },
      });
    } catch (error) {
      console.error('Size estimation error:', error);
      set({ estimatedSize: { video: null, audio: null } });
    }
  }, 500); // Debounce for 500ms

  return {
    url: '',
    platform: null,
    startTime: 0,
    endTime: 0,
    duration: 0,
    isProcessing: false,
    exportError: null,
    estimatedSize: { video: null, audio: null },
    setUrl: (url) => {
      const videoIdWithPlatform = extractVideoId(url);
      const platform = videoIdWithPlatform ? videoIdWithPlatform.split(':')[0] : null;
      set({ url, platform });
    },
    setStartTime: (startTime) => {
      const state = get();
      const validStartTime = Math.max(0, Math.min(startTime, state.endTime - 1));
      set({ startTime: validStartTime });
      debouncedEstimate();
    },
    setEndTime: (endTime) => {
      const state = get();
      const validEndTime = Math.min(state.duration, Math.max(endTime, state.startTime + 1));
      set({ endTime: validEndTime });
      debouncedEstimate();
    },
    setDuration: (duration) => {
      set({ duration, endTime: duration });
      // Don't estimate size here as the video might not be loaded yet
    },
    setIsProcessing: (isProcessing) => set({ isProcessing }),
    updateSizeEstimate: () => {
      debouncedEstimate();
    },
    exportVideo: async (format: 'video' | 'audio' = 'video') => {
      const state = get();
      set({ isProcessing: true, exportError: null });

      try {
        const response = await fetch('/api/trim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: state.url,
            startTime: state.startTime,
            endTime: state.endTime,
            format,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to export video');
        }

        // Create a blob from the response
        const blob = await response.blob();
        
        // Create a download link and click it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'audio' ? 'trimmed.mp3' : 'trimmed.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        set({ isProcessing: false });
      } catch (error) {
        console.error('Export error:', error);
        set({
          isProcessing: false,
          exportError: error instanceof Error ? error.message : 'Failed to export video',
        });
      }
    },
    reset: () => set({
      url: '',
      platform: null,
      startTime: 0,
      endTime: 0,
      duration: 0,
      isProcessing: false,
      exportError: null,
      estimatedSize: { video: null, audio: null },
    }),
  };
}); 