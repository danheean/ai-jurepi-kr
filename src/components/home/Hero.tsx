import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToolCharacter } from '@/components/tools/ToolCharacter';

/**
 * Hero: eyebrow, headline, subhead, CTA button, mascot.
 * Server-rendered, no interactive state.
 *
 * Layout uses CSS grid (not flex) so each column has a definite width —
 * a two-column flex here collapsed the Korean copy to one character per line
 * because a flex item's min-content width for `word-break:normal` Korean is a
 * single glyph. `break-keep` (word-break: keep-all) also wraps Korean at word
 * boundaries rather than mid-word.
 *
 * Decorative blobs positioned absolutely behind content for atmosphere.
 */
export function Hero() {
  const t = useTranslations('home');

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-surface-soft px-lg py-section"
    >
      {/* Decorative blobs (behind content) */}
      <div
        className="pointer-events-none absolute -z-10 rounded-full blur-2xl opacity-10"
        style={{
          width: '400px',
          height: '400px',
          top: '10%',
          right: '5%',
          backgroundColor: 'var(--accent-coral)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -z-10 rounded-full blur-2xl opacity-8"
        style={{
          width: '300px',
          height: '300px',
          bottom: '15%',
          left: '0%',
          backgroundColor: 'var(--accent-mint)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -z-10 rounded-full blur-2xl opacity-7"
        style={{
          width: '350px',
          height: '350px',
          top: '30%',
          left: '10%',
          backgroundColor: 'var(--accent-grape)',
        }}
        aria-hidden="true"
      />

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
            className="mb-lg break-keep font-display text-display-xl font-bold leading-tight text-ink"
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

        {/* Right: Tool Character */}
        <div className="hidden justify-center md:flex">
          <ToolCharacter
            slug="home"
            priority
            className="h-auto w-[280px] max-w-full"
          />
        </div>
      </div>
    </section>
  );
}
