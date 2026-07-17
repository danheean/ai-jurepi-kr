'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Binary,
  BookA,
  BookOpen,
  Bookmark,
  Braces,
  Cake,
  CalendarSync,
  Clock,
  Eraser,
  Globe,
  KeyRound,
  Link,
  ListTree,
  MapPin,
  NotebookPen,
  QrCode,
  Replace,
  RotateCcw,
  Ruler,
  Scissors,
  Trophy,
  Type,
  Users,
  Zap,
  Wrench,
} from 'lucide-react';

/**
 * Lucide icon name → component. Explicit map (tree-shake friendly) covering
 * every `icon` referenced in the tool registry. Maps icon string to LucideIcon.
 */
export const TOOL_ICONS: Record<string, LucideIcon> = {
  Binary,
  BookA,
  BookOpen,
  Bookmark,
  Braces,
  Cake,
  CalendarSync,
  Clock,
  Eraser,
  Globe,
  KeyRound,
  Link,
  ListTree,
  MapPin,
  NotebookPen,
  QrCode,
  Replace,
  RotateCcw,
  Ruler,
  Scissors,
  Trophy,
  Type,
  Users,
  Zap,
  Wrench,
};

interface ToolIconProps {
  name: string;
  className?: string;
}

export function ToolIcon({ name, className = 'w-6 h-6' }: ToolIconProps) {
  const Icon = TOOL_ICONS[name] ?? Wrench;
  return (
    <Icon
      className={className}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}
