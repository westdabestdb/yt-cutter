import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { Readable } from 'stream';

async function downloadTikTokVideo(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--format', 'best[vcodec^=h264]',
      '--no-warnings',
      '--no-playlist',
      '-o', '-',  // Output to stdout
      url
    ]);

    const chunks: Buffer[] = [];
    let errorOutput = '';

    ytdlp.stdout.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    ytdlp.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        const videoBuffer = Buffer.concat(chunks);
        resolve(videoBuffer);
      } else {
        console.error('yt-dlp error:', errorOutput);
        reject(new Error(`Failed to download video: ${errorOutput}`));
      }
    });

    ytdlp.on('error', (err) => {
      console.error('yt-dlp process error:', err);
      reject(err);
    });
  });
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 }
      );
    }

    try {
      console.log('Downloading video:', url);
      const videoBuffer = await downloadTikTokVideo(url);
      
      // Create headers for the video response
      const headers = new Headers();
      headers.set('Content-Type', 'video/mp4');
      headers.set('Content-Length', videoBuffer.length.toString());
      
      // Create a readable stream from the buffer
      const stream = Readable.from(videoBuffer);
      
      return new Response(stream as any, {
        headers,
      });
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error downloading video' },
      { status: 500 }
    );
  }
} 