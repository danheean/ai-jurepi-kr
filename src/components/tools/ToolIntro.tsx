'use client';

import { ToolCharacter } from '@/components/tools/ToolCharacter';

interface ToolIntroProps {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
}

export function ToolIntro({ slug, eyebrow, title, description }: ToolIntroProps) {
  return (
    <header className="mb-10 space-y-4">
      <div className="flex items-start gap-4">
        <ToolCharacter
          slug={slug}
          className="h-auto w-16 shrink-0 rounded-2xl shadow-card sm:w-[72px]"
        />
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-rose-ink)]">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-bold leading-tight text-charcoal sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>
      <p className="max-w-2xl text-lg text-mute leading-relaxed">
        {description}
      </p>
    </header>
  );
}
