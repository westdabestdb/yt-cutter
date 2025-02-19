import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';

async function downloadVideo(url: string, isTikTok: boolean): Promise<string> {
  if (!isTikTok) {
    // For YouTube, just get the URL
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '--format', 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]',
        '--get-url',
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
          const videoUrl = output.trim().split('\n')[0];
          resolve(videoUrl);
        } else {
          reject(new Error(`Failed to get video URL: ${error}`));
        }
      });
    });
  } else {
    // For TikTok, download the video to a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${randomUUID()}_input.mp4`);

    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '--format', 'best[vcodec^=h264]',
        '--no-warnings',
        '--no-playlist',
        '-o', tempFilePath,
        url
      ]);

      let error = '';

      ytdlp.stderr.on('data', (data) => {
        error += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code === 0) {
          resolve(tempFilePath);
        } else {
          reject(new Error(`Failed to download video: ${error}`));
        }
      });
    });
  }
}

export async function POST(req: Request) {
  try {
    const { url, startTime, endTime, format = 'video' } = await req.json();

    if (!url || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      const isTikTok = url.includes('tiktok.com');
      // Get video URL or downloaded file path
      const videoSource = await downloadVideo(url, isTikTok);
      console.log('Video source:', videoSource);

      // Create temporary file path for output
      const tempDir = os.tmpdir();
      const outputPath = path.join(tempDir, `${randomUUID()}.${format === 'audio' ? 'mp3' : 'mp4'}`);
      console.log('Output path:', outputPath);

      // Process video with FFmpeg
      await new Promise<void>((resolve, reject) => {
        const duration = endTime - startTime;
        console.log('Duration:', duration);

        const ffmpegArgs = [
          '-y', // Overwrite output files without asking
          '-ss', startTime.toString(),
          '-i', videoSource,
          '-t', duration.toString(),
        ];

        if (format === 'audio') {
          // Audio-only export
          ffmpegArgs.push(
            '-vn', // No video
            '-c:a', 'libmp3lame',
            '-q:a', '2', // Variable bit rate quality (0-9, 0=best, 9=worst)
            '-metadata', 'title=Trimmed with SliceTube',
            outputPath
          );
        } else {
          // Video export (copy codecs when possible)
          ffmpegArgs.push(
            '-c', 'copy', // Try to copy both audio and video codecs
            '-avoid_negative_ts', 'make_zero',
            '-movflags', '+faststart',
            outputPath
          );
        }

        console.log('FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        let ffmpegOutput = '';
        let ffmpegError = '';

        ffmpeg.stdout.on('data', (data) => {
          ffmpegOutput += data.toString();
          console.log('FFmpeg output:', data.toString());
        });

        ffmpeg.stderr.on('data', (data) => {
          ffmpegError += data.toString();
          console.log('FFmpeg progress:', data.toString());
        });

        ffmpeg.on('close', async (code) => {
          // Clean up the input file if it was a TikTok video
          if (isTikTok) {
            try {
              await unlink(videoSource);
            } catch (err) {
              console.error('Error deleting input file:', err);
            }
          }

          if (code === 0) {
            console.log('FFmpeg completed successfully');
            resolve();
          } else {
            console.error('FFmpeg error:', ffmpegError);
            // If copying codecs fails, try again with transcoding
            if (format === 'video' && ffmpegError.includes('Error while copying')) {
              console.log('Retrying with transcoding...');
              const transcodeArgs = [
                '-y',
                '-ss', startTime.toString(),
                '-i', videoSource,
                '-t', duration.toString(),
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-movflags', '+faststart',
                outputPath
              ];
              
              const transcodeFFmpeg = spawn('ffmpeg', transcodeArgs);
              
              transcodeFFmpeg.stderr.on('data', (data) => {
                console.log('Transcode progress:', data.toString());
              });
              
              transcodeFFmpeg.on('close', (transcodeCode) => {
                if (transcodeCode === 0) {
                  console.log('Transcode completed successfully');
                  resolve();
                } else {
                  reject(new Error('Failed to transcode video'));
                }
              });
            } else {
              reject(new Error(`FFmpeg failed with code ${code}: ${ffmpegError}`));
            }
          }
        });

        ffmpeg.on('error', (err) => {
          console.error('FFmpeg process error:', err);
          reject(err);
        });
      });

      // Read and return the processed file
      const processedFile = await require('fs').promises.readFile(outputPath);
      
      // Clean up the temporary file
      await unlink(outputPath).catch(err => {
        console.error('Error deleting temp file:', err);
      });

      console.log('Sending response...');
      return new NextResponse(processedFile, {
        headers: {
          'Content-Type': format === 'audio' ? 'audio/mpeg' : 'video/mp4',
          'Content-Disposition': `attachment; filename="trimmed.${format === 'audio' ? 'mp3' : 'mp4'}"`,
        },
      });
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing video' },
      { status: 500 }
    );
  }
} 