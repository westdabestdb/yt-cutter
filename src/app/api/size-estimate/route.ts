import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

async function getVideoInfo(url: string): Promise<{ bitrate: number }> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--format', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--print', '%(format_id)s,%(filesize,filesize_approx)s,%(tbr)s',
      '--no-warnings',
      url
    ]);

    let output = '';
    let error = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      error += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        const [_, filesize, bitrate] = output.trim().split(',');
        resolve({
          bitrate: parseFloat(bitrate) || 0
        });
      } else {
        reject(new Error(`Failed to get video info: ${error}`));
      }
    });
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export async function POST(req: Request) {
  try {
    const { url, startTime, endTime, format } = await req.json();

    if (!url || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      const duration = endTime - startTime;
      const info = await getVideoInfo(url);
      
      // Calculate estimated size based on format and duration
      let estimatedSize: number;
      
      if (format === 'audio') {
        // Estimate MP3 size (192kbps)
        const audioBitrate = 192; // kbps
        estimatedSize = (audioBitrate * 1000 * duration) / 8; // bytes
      } else {
        // Estimate video size based on original bitrate
        const videoBitrate = info.bitrate; // kbps
        estimatedSize = (videoBitrate * 1000 * duration) / 8; // bytes
      }

      // Add 5% buffer for container overhead
      estimatedSize *= 1.05;

      return NextResponse.json({
        size: formatFileSize(estimatedSize),
        bytes: Math.round(estimatedSize)
      });
    } catch (error) {
      console.error('Size estimation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error estimating size' },
      { status: 500 }
    );
  }
} 