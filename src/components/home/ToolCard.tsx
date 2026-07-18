'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/home/FavoriteButton';
import { ToolIcon, accentTileClass } from './toolStyle';
import type { ToolMeta } from '@/tools/types';

interface ToolCardProps extends ToolMeta {
  displayName?: string;
  displayDescription?: string;
  isFavorited?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

/**
 * Compact tool card: icon tile (left) + content (right).
 * Live tools are clickable; coming_soon are dimmed and non-interactive.
 * Hover effect: translateY(-2px) for live tools.
 * Icon tile uses category accent color (soft bg + accent icon).
 * Favorite button (top-right) only renders for live tools.
 */
export function ToolCard({
  slug,
  status,
  icon,
  accent,
  isPopular,
  displayName,
  displayDescription,
  addedAt,
  isFavorited = false,
  onToggleFavorite,
}: ToolCardProps) {
  const isDisabled = status === 'coming_soon';
  const accentClasses = accentTileClass(accent);

  // Check if tool is new (within last 7 days)
  const addedDate = new Date(addedAt);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNew = daysDiff <= 7;

  const content = (
    <div className="flex gap-4 h-full">
      {/* Icon tile (left): 44px, rounded-md, accent-soft bg, accent icon */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-md ${accentClasses.bg} flex items-center justify-center border border-hairline`}>
        <div className={accentClasses.text}>
          <ToolIcon name={icon} className="w-5 h-5" />
        </div>
      </div>

      {/* Content (right): title, description, badges */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-heading-md font-semibold text-ink mb-1 line-clamp-2">
            {displayName}
          </h3>
          <p className="text-body-sm text-body line-clamp-2">
            {displayDescription}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-xs flex-wrap pt-2">
          {isNew && <Badge variant="primary" size="sm">New</Badge>}
          {isPopular && <Badge variant="info" size="sm">Popular</Badge>}
          {isDisabled && (
            <Badge variant="neutral" size="sm">Coming Soon</Badge>
          )}
        </div>
      </div>
    </div>
  );

  if (isDisabled) {
    return (
      <div
        data-testid={`tool-card-${slug}`}
        aria-disabled="true"
        className="bg-surface-card rounded-md p-lg border border-hairline opacity-70 cursor-default min-h-[140px] flex items-start"
      >
        {content}
      </div>
    );
  }

  return (
    <div className="relative">
      <Link
        href={`/tools/${slug}`}
        data-testid={`tool-card-${slug}`}
        className="group block h-full"
      >
        <div className="bg-surface-card rounded-md p-lg border border-hairline min-h-[140px] flex items-start transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-primary group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 cursor-pointer">
          {content}
        </div>
      </Link>

      {/* Favorite button (top-right, outside the link) */}
      {onToggleFavorite && (
        <div className="absolute top-2 right-2">
          <FavoriteButton
            slug={slug}
            name={displayName || slug}
            isFavorited={isFavorited}
            onToggle={onToggleFavorite}
          />
        </div>
      )}
    </div>
  );
}
