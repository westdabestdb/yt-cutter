import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SliceTube - Precision Video Trimming',
  description: 'Trim YouTube videos with precision. Extract specific segments from any YouTube video in both video and audio formats.',
  keywords: ['youtube', 'video trimmer', 'video editor', 'youtube downloader', 'video clip', 'online video tools'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
