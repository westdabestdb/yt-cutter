'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useVideoStore } from './store/video-store';
import { extractVideoId, supportedPlatforms, Platform } from '../lib/validations/youtube';
import { VideoTrimmer } from './components/video-trimmer';
import { PlayIcon, PauseIcon, DownloadIcon, ScissorsIcon, Link1Icon, SpeakerLoudIcon, VideoIcon } from '@radix-ui/react-icons';
import ReactPlayer, { Config } from 'react-player';

const VideoPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black/90 rounded-xl">
      <div className="text-white/80 flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div>Loading player...</div>
      </div>
    </div>
  ),
}) as typeof ReactPlayer;

export default function Home() {
  const {
    url,
    platform,
    setUrl,
    startTime,
    endTime,
    setDuration,
    isProcessing,
    setIsProcessing,
    estimatedSize,
    exportVideo,
  } = useVideoStore();
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [playerConfig, setPlayerConfig] = useState<Config>({
    youtube: {
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        rel: 0,
        playsinline: 1,
      },
    },
    file: {
      attributes: {
        controlsList: 'nodownload',
        crossOrigin: 'anonymous',
      },
      forceVideo: true,
      forceAudio: false,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);

  const downloadTikTokVideo = async (url: string): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/download-tiktok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDirectUrl(null);
    setVideoBlob(null);
    
    const formData = new FormData(e.currentTarget);
    const videoUrl = formData.get('url') as string;
    const videoIdWithPlatform = extractVideoId(videoUrl);

    if (!videoIdWithPlatform) {
      setError('Invalid video URL. Please check the URL and try again.');
      return;
    }

    const [platform] = videoIdWithPlatform.split(':');
    
    try {
      // Reset player state
      setIsReady(false);
      setCurrentTime(0);
      setIsPlaying(false);
      
      // For TikTok videos
      if (platform === 'tiktok') {
        const blobUrl = await downloadTikTokVideo(videoUrl);
        setVideoBlob(blobUrl);
        setUrl(videoUrl); // Store original URL but use blob URL for player
      } else {
        setUrl(videoUrl);
      }
    } catch (error) {
      console.error('URL processing error:', error);
      setError('Failed to process video URL. Please try again.');
    }
  };

  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    if (!isReady) return;
    setCurrentTime(playedSeconds);
    
    if (playedSeconds >= endTime) {
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.seekTo(startTime, 'seconds');
      }
    }
  };

  const handleSeek = (time: number) => {
    if (playerRef.current && isReady) {
      playerRef.current.seekTo(time, 'seconds');
      setCurrentTime(time);
    }
  };

  const togglePlayPause = () => {
    if (!isReady) return;

    if (currentTime >= endTime) {
      handleSeek(startTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReady = () => {
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      setDuration(duration);
      setIsReady(true);
    }
  };

  const handleError = (error: any) => {
    console.error('Player error:', error);
    setError('Failed to load video');
    setIsReady(false);
  };

  const handleExport = async (type: 'video' | 'audio') => {
    try {
      await exportVideo(type);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Cleanup blob URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (videoBlob) {
        URL.revokeObjectURL(videoBlob);
      }
    };
  }, [videoBlob]);

  useEffect(() => {
    setIsReady(false);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [url]);

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0)_0,rgba(0,0,0,0.5)_40%,rgba(0,0,0,0)_60%,rgba(0,0,0,0)_100%)] bg-[length:200%_100%] animate-[gradient_4s_linear_infinite]" />
      <div className="absolute inset-0 bg-[url('/grid.png')] opacity-[0.03]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
      
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 relative">
        {/* Header */}
        <header className="text-center space-y-6 py-12">
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-cyan-500 opacity-70 blur group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="absolute -inset-1 bg-pink-500 opacity-70 blur group-hover:opacity-100 transition-opacity duration-500 animate-pulse delay-75" />
            <h1 className="relative text-6xl md:text-7xl font-bold text-white tracking-wider">
              Slice<span className="text-cyan-400">Tube</span>
            </h1>
            <div className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
          </div>
          <div className="relative">
            <p className="text-lg text-cyan-200/80 font-light tracking-wider uppercase">
              Precision Video Trimming
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          </div>
        </header>

        {/* URL Input Section */}
        <section className="relative group">
          <div className="absolute inset-0 border border-cyan-500/30 rounded-lg" />
          <div className="absolute inset-0 bg-cyan-500/5" />
          <div className="relative bg-black/80 border border-cyan-500/20 rounded-lg p-8 group-hover:border-cyan-400/40 transition-colors duration-300">
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-cyan-400 uppercase tracking-wider mb-2"
                >
                  Enter Video URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Link1Icon className="w-5 h-5 text-cyan-500" />
                  </div>
                  <input
                    type="text"
                    name="url"
                    id="url"
                    className="block w-full pl-10 pr-4 py-3 bg-black border border-cyan-500/30 rounded-lg text-cyan-100 placeholder:text-cyan-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-pink-400 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                    {error}
                  </p>
                )}
              </div>

              {/* Supported Platforms */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider">
                  Supported Platforms
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {supportedPlatforms.map((platform: Platform) => (
                    <div
                      key={platform.name}
                      className="flex items-center gap-2 p-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg"
                    >
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-xs text-cyan-400/90 font-medium">
                        {platform.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full group relative flex items-center justify-center gap-2 py-3 px-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg font-medium text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300"
              >
                <ScissorsIcon className="w-5 h-5" />
                INITIALIZE
              </button>
            </form>
          </div>
        </section>

        {/* Video Player Section */}
        {url && (
          <section className="relative group">
            <div className="absolute inset-0 border border-pink-500/30 rounded-lg" />
            <div className="absolute inset-0 bg-pink-500/5" />
            <div className="relative bg-black/80 border border-pink-500/20 rounded-lg p-8 space-y-8 group-hover:border-pink-400/40 transition-colors duration-300">
              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-pink-500/30">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/90">
                    <div className="text-white/80 flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <div>Loading video...</div>
                    </div>
                  </div>
                ) : (
                  <VideoPlayer
                    ref={playerRef}
                    url={videoBlob || url}
                    width="100%"
                    height="100%"
                    playing={isPlaying}
                    onReady={handleReady}
                    onError={(error: any) => {
                      console.error('Player error:', { error, url: videoBlob || url });
                      setError('Failed to load video. Please make sure the video is public and accessible.');
                      setIsReady(false);
                    }}
                    onDuration={setDuration}
                    onProgress={handleProgress}
                    progressInterval={100}
                    controls={false}
                    playsinline
                    pip={false}
                    stopOnUnmount
                    config={playerConfig}
                  />
                )}
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={togglePlayPause}
                  disabled={!isReady}
                  className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              <VideoTrimmer
                currentTime={currentTime}
                onSeek={handleSeek}
              />

              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => handleExport('video')}
                  disabled={isProcessing || !isReady}
                  className="relative flex items-center gap-2 py-3 px-6 bg-cyan-500/10 border border-cyan-500/30 rounded-lg font-medium text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <div className="flex flex-col items-start">
                    <span className="flex items-center gap-2 uppercase tracking-wider">
                      <VideoIcon className="w-5 h-5" />
                      Export Video
                    </span>
                    {estimatedSize.video && (
                      <span className="text-xs text-cyan-500">~{estimatedSize.video}</span>
                    )}
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                      <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleExport('audio')}
                  disabled={isProcessing || !isReady}
                  className="relative flex items-center gap-2 py-3 px-6 bg-pink-500/10 border border-pink-500/30 rounded-lg font-medium text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <div className="flex flex-col items-start">
                    <span className="flex items-center gap-2 uppercase tracking-wider">
                      <SpeakerLoudIcon className="w-5 h-5" />
                      Export Audio
                    </span>
                    {estimatedSize.audio && (
                      <span className="text-xs text-pink-500">~{estimatedSize.audio}</span>
                    )}
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                      <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              {exportError && (
                <p className="mt-2 text-sm text-pink-400 text-center flex items-center justify-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                  {exportError}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
} 