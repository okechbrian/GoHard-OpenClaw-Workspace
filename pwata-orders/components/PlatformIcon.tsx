import { siInstagram, siFacebook, siX, siTiktok } from "simple-icons";

// LinkedIn was removed from simple-icons at the brand owner's request — pill falls back to text-only.
const ICON_MAP: Record<string, { path: string; title: string }> = {
  Instagram: siInstagram,
  Facebook: siFacebook,
  "Twitter/X": siX,
  X: siX,
  TikTok: siTiktok,
};

interface Props {
  platform: string;
  size?: number;
  className?: string;
}

export default function PlatformIcon({ platform, size = 14, className }: Props) {
  const icon = ICON_MAP[platform];
  if (!icon) return null;
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-label={icon.title}
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}
    >
      <path d={icon.path} />
    </svg>
  );
}
