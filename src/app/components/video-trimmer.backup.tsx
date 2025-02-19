'use client';

import { useEffect, useRef } from 'react';
import { useVideoStore } from '../store/video-store';
import { ClockIcon } from '@radix-ui/react-icons';

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

export const VideoTrimmer = ({ currentTime, onSeek }: VideoTrimmerProps) => {
  const {
    duration,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
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

  return (
    <div className="w-full space-y-6">
      {/* Time displays */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-3 bg-black/30 rounded-xl border border-gray-800">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Start
          </div>
          <div className="text-lg font-mono font-bold text-blue-400">
            {formatTime(startTime)}
          </div>
        </div>
        <div className="flex flex-col items-center p-3 bg-black/30 rounded-xl border border-gray-800">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Current
          </div>
          <div className="text-lg font-mono font-bold text-gray-100">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="flex flex-col items-center p-3 bg-black/30 rounded-xl border border-gray-800">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            End
          </div>
          <div className="text-lg font-mono font-bold text-violet-400">
            {formatTime(endTime)}
          </div>
        </div>
        <div className="flex flex-col items-center p-3 bg-gradient-to-r from-blue-500/10 to-violet-500/10 backdrop-blur-sm rounded-xl border border-gray-800">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Duration
          </div>
          <div className="text-lg font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            {formatTime(trimmedDuration)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pt-2">
        <div
          ref={sliderRef}
          className="relative h-8 bg-black/50 rounded-lg overflow-hidden cursor-pointer border border-gray-800 shadow-inner"
          onClick={handleTimelineClick}
        >
          {/* Timeline gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-gray-800/50" />

          {/* Selected range */}
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500/20 to-violet-500/20 backdrop-blur-sm transition-all duration-150"
            style={{
              left: `${startPercentage}%`,
              width: `${endPercentage - startPercentage}%`,
            }}
          />

          {/* Current time indicator */}
          <div
            className="absolute w-0.5 h-full bg-white shadow-lg transition-all duration-150 ease-linear"
            style={{ left: `${currentPercentage}%` }}
          />

          {/* Start handle */}
          <div
            className="absolute top-0 w-3 h-full bg-gradient-to-r from-blue-500 to-blue-600 cursor-ew-resize hover:from-blue-400 hover:to-blue-500 transition-colors shadow-lg z-10 group"
            style={{ left: `${startPercentage}%` }}
            onMouseDown={handleStartDrag}
          >
            <div className="absolute inset-y-0 -left-0.5 w-0.5 bg-white opacity-50 group-hover:opacity-100" />
          </div>

          {/* End handle */}
          <div
            className="absolute top-0 w-3 h-full bg-gradient-to-r from-violet-500 to-violet-600 cursor-ew-resize hover:from-violet-400 hover:to-violet-500 transition-colors shadow-lg z-10 group"
            style={{ right: `${100 - endPercentage}%` }}
            onMouseDown={handleEndDrag}
          >
            <div className="absolute inset-y-0 -right-0.5 w-0.5 bg-white opacity-50 group-hover:opacity-100" />
          </div>
        </div>

        {/* Timeline labels */}
        <div className="flex justify-between mt-2">
          <div className="text-xs font-medium text-gray-500">0:00</div>
          <div className="text-xs font-medium text-gray-500">{formatTime(duration)}</div>
        </div>
      </div>
    </div>
  );
}; 