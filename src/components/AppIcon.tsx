import {
  Droplets,
  BookOpen,
  Dumbbell,
  Heart,
  Brain,
  Moon,
  Sun,
  Leaf,
  Sparkles,
  Music,
  Coffee,
  PenLine,
  Home,
  Briefcase,
  Circle,
  Footprints,
  Flower2,
  Apple,
  type LucideIcon,
} from 'lucide-react'

const map: Record<string, LucideIcon> = {
  droplets: Droplets,
  footprints: Footprints,
  'book-open': BookOpen,
  dumbbell: Dumbbell,
  heart: Heart,
  brain: Brain,
  moon: Moon,
  sun: Sun,
  leaf: Leaf,
  sparkles: Sparkles,
  music: Music,
  coffee: Coffee,
  apple: Apple,
  pen: PenLine,
  'flower-2': Flower2,
  home: Home,
  briefcase: Briefcase,
}

export function AppIcon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const Icon = map[name] || Circle
  return <Icon size={size} strokeWidth={1.5} color={color} />
}
