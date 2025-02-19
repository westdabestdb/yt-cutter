'use client';

import { useEffect, useRef } from 'react';
import { useVideoStore } from '../store/video-store';
import { ClockIcon, VideoIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';

interface VideoTrimmerProps {
  currentTime: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const calculateTimeFromMouseEvent = (
  e: MouseEvent | React.MouseEvent,
  sliderRect: DOMRect,
  duration: number
): number => {
  const x = e.clientX - sliderRect.left;
  const percentage = Math.max(0, Math.min(1, x / sliderRect.width));
  return percentage * duration;
};

const ExportButton = ({
  onClick,
  isProcessing,
  icon: Icon,
  label,
  sizeEstimate,
}: {
  onClick: () => void;
  isProcessing: boolean;
  icon: React.ElementType;
  label: string;
  sizeEstimate: string | null;
}) => (
  <button
    onClick={onClick}
    disabled={isProcessing}
    className={cn(
      'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg',
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'hover:from-blue-600 hover:to-blue-700',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transition-all duration-200 ease-in-out',
      'relative overflow-hidden group'
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="flex flex-col items-start">
      <span>{label}</span>
      {sizeEstimate && (
        <span className="text-xs text-blue-100">Estimated size: {sizeEstimate}</span>
      )}
    </span>
    {isProcessing && (
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )}
  </button>
);

export const VideoTrimmer = ({ currentTime, onSeek }: VideoTrimmerProps) => {
  const {
    duration,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    url,
    isProcessing,
    estimatedSize,
    exportVideo,
  } = useVideoStore();

  const sliderRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  useEffect(() => {
    if (endTime === 0 && duration > 0) {
      setEndTime(duration);
    }
  }, [duration, endTime, setEndTime]);

  const startPercentage = (startTime / duration) * 100;
  const endPercentage = (endTime / duration) * 100;
  const currentPercentage = (currentTime / duration) * 100;

  const handleStartDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      setStartTime(Math.max(0, Math.min(newTime, endTime - 1)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleEndDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      setEndTime(Math.min(duration, Math.max(newTime, startTime + 1)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate trimmed duration
  const trimmedDuration = endTime - startTime;

  const handleExport = async (type: 'video' | 'audio') => {
    try {
      await exportVideo(type);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Time displays */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-3 bg-black border border-cyan-500/30 rounded-lg">
          <div className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Start
          </div>
          <div className="text-lg font-mono font-bold text-cyan-400">
            {formatTime(startTime)}
          </div>
        </div>
        <div className="flex flex-col items-center p-3 bg-black border border-pink-500/30 rounded-lg">
          <div className="text-xs font-medium uppercase tracking-wider text-pink-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Current
          </div>
          <div className="text-lg font-mono font-bold text-pink-400">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="flex flex-col items-center p-3 bg-black border border-cyan-500/30 rounded-lg">
          <div className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            End
          </div>
          <div className="text-lg font-mono font-bold text-cyan-400">
            {formatTime(endTime)}
          </div>
        </div>
        <div className="flex flex-col items-center p-3 bg-black border border-pink-500/30 rounded-lg group hover:border-pink-400/40 transition-colors duration-300">
          <div className="text-xs font-medium uppercase tracking-wider text-pink-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Duration
          </div>
          <div className="text-lg font-mono font-bold text-pink-400">
            {formatTime(trimmedDuration)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pt-2">
        <div
          ref={sliderRef}
          className="relative h-8 bg-black border border-cyan-500/30 rounded-lg overflow-hidden cursor-pointer group"
          onClick={handleTimelineClick}
        >
          {/* Timeline background */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.8)_100%)]" />

          {/* Selected range */}
          <div
            className="absolute h-full bg-cyan-500/10 transition-all duration-150"
            style={{
              left: `${startPercentage}%`,
              width: `${endPercentage - startPercentage}%`,
            }}
          />

          {/* Grid lines */}
          <div className="absolute inset-0 bg-[url('/grid.png')] opacity-[0.05]" />

          {/* Current time indicator */}
          <div
            className="absolute w-0.5 h-full bg-pink-500 transition-all duration-150 ease-linear"
            style={{ left: `${currentPercentage}%` }}
          />

          {/* Start handle */}
          <div
            className="absolute top-0 w-1 h-full bg-cyan-500 cursor-ew-resize group-hover:w-2 transition-all duration-200 z-10"
            style={{ left: `${startPercentage}%` }}
            onMouseDown={handleStartDrag}
          >
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-cyan-500 bg-black rounded-full" />
          </div>

          {/* End handle */}
          <div
            className="absolute top-0 w-1 h-full bg-cyan-500 cursor-ew-resize group-hover:w-2 transition-all duration-200 z-10"
            style={{ right: `${100 - endPercentage}%` }}
            onMouseDown={handleEndDrag}
          >
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-cyan-500 bg-black rounded-full" />
          </div>
        </div>

        {/* Timeline labels */}
        <div className="flex justify-between mt-2">
          <div className="text-xs font-medium text-cyan-500 font-mono">00:00</div>
          <div className="text-xs font-medium text-cyan-500 font-mono">{formatTime(duration)}</div>
        </div>
      </div>
    </div>
  );
}; 