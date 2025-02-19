import Image from 'next/image';

interface PlatformLogoProps {
  platform: string;
  className?: string;
}

export const PlatformLogo = ({ platform, className = "w-5 h-5" }: PlatformLogoProps) => {
  const logos: Record<string, string> = {
    YouTube: '/logos/youtube.svg',
    TikTok: '/logos/tiktok.svg',
  };

  return (
    <div className={className}>
      <Image
        src={logos[platform]}
        alt={`${platform} logo`}
        width={24}
        height={24}
        className="w-full h-full object-contain"
      />
    </div>
  );
}; 