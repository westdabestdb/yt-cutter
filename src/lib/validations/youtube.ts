import { z } from 'zod';

export interface Platform {
  name: string;
  domains: string[];
  displayName: string;
}

export const videoUrlSchema = z.string().refine((url) => {
  const patterns = [
    // YouTube
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    // TikTok
    /^(https?:\/\/)?(www\.|vm\.)?(tiktok\.com)\/.+/,
  ];

  return patterns.some(pattern => pattern.test(url));
}, {
  message: 'Please enter a valid YouTube or TikTok URL',
});

export type VideoUrlInput = z.infer<typeof videoUrlSchema>;

export const extractVideoId = (url: string): string | null => {
  const patterns = [
    // YouTube
    {
      pattern: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
      platform: 'youtube'
    },
    // TikTok - support both /video/ and /t/ formats
    {
      pattern: /tiktok\.com\/@[^/]+\/(?:video|t)\/(\d+)/,
      platform: 'tiktok'
    },
  ];

  for (const { pattern, platform } of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `${platform}:${match[1]}`;
    }
  }

  return null;
};

// List of supported platforms with their names and domains
export const supportedPlatforms: Platform[] = [
  {
    name: 'YouTube',
    displayName: 'YouTube',
    domains: ['youtube.com', 'youtu.be'],
  },
  {
    name: 'TikTok',
    displayName: 'TikTok',
    domains: ['tiktok.com'],
  }
] as const; 