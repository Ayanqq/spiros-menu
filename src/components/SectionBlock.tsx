import type { ParsedSection } from '../utils/parseRecipeDescription';

interface SectionBlockProps {
  section: ParsedSection;
}

export default function SectionBlock({ section }: SectionBlockProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      {section.title && (
        <h2 className="mb-4 text-xl font-bold text-amber-400 sm:text-2xl">{section.title}</h2>
      )}

      {section.yield && (
        <p className="mb-4 inline-block rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-300">
          Выход: {section.yield}
        </p>
      )}

      {section.ingredients.length > 0 && (
        <div className={section.steps.length > 0 ? 'mb-6' : ''}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Ингредиенты
          </h3>
          <ul className="space-y-2.5">
            {section.ingredients.map((ingredient, i) => (
              <li key={i} className="flex items-start gap-3 text-lg text-neutral-200">
                <span
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-neutral-600"
                  aria-hidden="true"
                />
                <span className="leading-snug">
                  {ingredient.name}
                  {ingredient.amount && (
                    <span className="ml-2 font-semibold text-amber-300">— {ingredient.amount}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.steps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Приготовление
          </h3>
          <ol className="space-y-4">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-4 text-lg leading-relaxed text-neutral-200 sm:text-xl">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-base font-bold text-amber-400">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
