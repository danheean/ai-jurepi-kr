import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ToolCharacterProps {
  /** Tool slug → /characters/<slug>.webp (also 'home' for the welcome pose). */
  slug: string;
  /** Optional alt override; defaults to the localized generic character alt. */
  alt?: string;
  /** Extra classes for responsive sizing; replaces the default size classes. */
  className?: string;
  priority?: boolean;
}

/**
 * ToolCharacter renders a tool's themed Jurepi mascot illustration
 * (public/characters/<slug>.webp — a uniform 1:1 square avatar built by
 * scripts/slice-characters.mjs, preferring a clean per-tool individual image
 * and falling back to a square-padded sprite tile). Server-compatible;
 * isomorphic useTranslations localizes the alt. Explicit intrinsic 1:1
 * width/height keeps layout CLS-safe; callers scale it responsively through
 * className.
 */
export function ToolCharacter({
  slug,
  alt,
  className,
  priority = false,
}: ToolCharacterProps): React.ReactNode {
  const t = useTranslations('toolPage');
  return (
    <Image
      src={`/characters/${slug}.webp`}
      alt={alt ?? t('characterAlt')}
      width={300}
      height={300}
      priority={priority}
      className={
        className ??
        // Small framed avatar that sits beside the tool title, with the
        // home welcome character's rounded, lifted look.
        'h-auto w-[64px] rounded-md shadow-card sm:w-[72px]'
      }
    />
  );
}
