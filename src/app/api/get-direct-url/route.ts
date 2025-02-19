import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

async function getDirectVideoUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // For TikTok videos, we need to use specific formats and headers
    const ytdlpArgs = [
      '--format', 'bestvideo[vcodec^=h264]+bestaudio/best[vcodec^=h264]/best',  // Prefer H264 codec
      '--get-url',
      '--no-warnings',
      '--no-playlist',
      '--extractor-args', 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
      '--add-header', 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      '--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '--add-header', 'Accept-Language: en-us',
      '--add-header', 'Accept-Encoding: gzip, deflate, br',
      url
    ];

    console.log('Running yt-dlp with args:', ytdlpArgs.join(' '));
    const ytdlp = spawn('yt-dlp', ytdlpArgs);

    let output = '';
    let error = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
      console.log('yt-dlp output:', data.toString());
    });

    ytdlp.stderr.on('data', (data) => {
      error += data.toString();
      console.error('yt-dlp error:', data.toString());
    });

    ytdlp.on('close', (code) => {
      if (code === 0 && output.trim()) {
        const directUrl = output.trim().split('\n')[0];
        console.log('Successfully got direct URL');
        
        // For TikTok URLs, we need to add a Referer header to the video URL
        if (url.includes('tiktok.com')) {
          return NextResponse.json({
            directUrl,
            headers: {
              'Referer': 'https://www.tiktok.com/',
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
            }
          });
        }
        
        resolve(directUrl);
      } else {
        console.error('yt-dlp failed with code:', code);
        console.error('yt-dlp error output:', error);
        reject(new Error(`Failed to get direct URL: ${error || 'Unknown error'}`));
      }
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
      console.log('Processing URL:', url);
      const result = await getDirectVideoUrl(url);
      console.log('Got direct URL for:', url);
      
      // If it's a TikTok URL, we'll get back an object with headers
      if (typeof result === 'object' && 'directUrl' in result) {
        return NextResponse.json(result);
      }
      
      // For other platforms, just return the URL
      return NextResponse.json({ directUrl: result });
    } catch (error) {
      console.error('Error getting direct URL:', error);
      throw error;
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error getting direct URL' },
      { status: 500 }
    );
  }
} 