import { Circle, Flame, Heart } from 'lucide-react';

const iconMap = {
  Heart,
  Flame
} as const;

export function AppIcon({ icon, className = 'h-4 w-4' }: { icon?: string; className?: string }) {
  const Component = icon && icon in iconMap ? iconMap[icon as keyof typeof iconMap] : Circle;
  return <Component className={className} />;
}
