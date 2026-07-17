import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Hero: eyebrow, headline, subhead, CTA button, mascot.
 * Server-rendered, no interactive state.
 *
 * Layout uses CSS grid (not flex) so each column has a definite width —
 * a two-column flex here collapsed the Korean copy to one character per line
 * because a flex item's min-content width for `word-break:normal` Korean is a
 * single glyph. `break-keep` (word-break: keep-all) also wraps Korean at word
 * boundaries rather than mid-word.
 */
export function Hero() {
  const t = useTranslations('home');

  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-surface-soft px-lg py-section"
    >
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 items-center gap-xl md:grid-cols-2 md:gap-section">
        {/* Left: Eyebrow, Headline, Subhead, CTA */}
        <div>
          {/* Eyebrow */}
          <div className="mb-md inline-flex items-center gap-xs rounded-full border border-hairline bg-surface-card px-lg py-sm">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-body-sm font-semibold text-primary">
              {t('eyebrow')}
            </p>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="mb-lg break-keep text-display-xl font-bold leading-tight text-ink"
          >
            {t('title')}
          </h1>

          {/* Subhead */}
          <p className="mb-xl max-w-[34rem] break-keep text-body-md leading-relaxed text-body">
            {t('subtitle')}
          </p>

          {/* CTA Button */}
          <a
            href={`mailto:${t('contactEmail')}?subject=${encodeURIComponent(t('requestSubject') || '')}`}
            className="inline-flex items-center gap-sm rounded-md bg-primary px-lg py-md text-button-md font-semibold text-on-primary transition-all duration-200 ease-out hover:bg-primary-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
          >
            {t('ctaButton')}
          </a>
        </div>

        {/* Right: Mascot */}
        <div className="hidden justify-center md:flex">
          <Image
            src="/jurepi-character.png"
            alt=""
            width={320}
            height={320}
            priority
            className="h-auto w-[280px] max-w-full"
          />
        </div>
      </div>
    </section>
  );
}
