'use client';

/**
 * CategoryFilter: pill chips with active state in brand red.
 * Active chip: bg-primary + text-on-primary.
 * Inactive chip: bg-surface-card + text-ink.
 */
interface CategoryFilterProps {
  categories: string[];
  activeCategory?: string;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="px-lg py-lg bg-canvas border-b border-hairline">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-md overflow-x-auto pb-md">
        {/* All button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-lg py-sm rounded-full whitespace-nowrap text-button-md font-semibold transition-all duration-150 ${
            !activeCategory
              ? 'bg-primary text-on-primary hover:bg-primary-pressed'
              : 'bg-surface-card text-ink hover:bg-hairline-soft'
          }`}
          data-testid="category-all"
        >
          All
        </button>

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-lg py-sm rounded-full whitespace-nowrap text-button-md font-semibold transition-all duration-150 ${
              activeCategory === category
                ? 'bg-primary text-on-primary hover:bg-primary-pressed'
                : 'bg-surface-card text-ink hover:bg-hairline-soft'
            }`}
            data-testid={`category-${category}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
