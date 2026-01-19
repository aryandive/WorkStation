import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getYoutubeId(url) {
  try {
      const u = new URL(url);
      const host = u.hostname;
      if (host.includes('youtu.be')) {
          return u.pathname.split('/').filter(Boolean)[0] || null;
      }
      if (host.includes('youtube.com')) {
          if (u.searchParams.get('v')) return u.searchParams.get('v');
          const path = u.pathname.split('/').filter(Boolean);
          if (path[0] === 'shorts' && path[1]) return path[1];
          if (path[0] === 'embed' && path[1]) return path[1];
      }
  } catch (e) { return null; }
  return null;
}