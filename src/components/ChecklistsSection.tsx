import type { Checklist, ChecklistItem } from '../types/recipes';

interface ChecklistsSectionProps {
  checklists: Checklist[];
}

function getItemLabel(item: string | ChecklistItem): string | null {
  if (typeof item === 'string') return item.trim() || null;
  if (item && typeof item === 'object') {
    return item.text ?? item.name ?? null;
  }
  return null;
}

export default function ChecklistsSection({ checklists }: ChecklistsSectionProps) {
  const visible = checklists.filter(
    (c) => c && typeof c === 'object' && (c.name || (Array.isArray(c.items) && c.items.length > 0)),
  );

  if (visible.length === 0) return null;

  return (
    <div className="space-y-4">
      {visible.map((checklist, i) => {
        const items = Array.isArray(checklist.items) ? checklist.items : [];
        return (
          <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            {checklist.name && <h3 className="mb-3 text-lg font-bold text-neutral-100">{checklist.name}</h3>}
            {items.length > 0 && (
              <ul className="space-y-2.5">
                {items.map((item, j) => {
                  const label = getItemLabel(item);
                  if (!label) return null;
                  return (
                    <li key={j} className="flex items-start gap-3 text-lg text-neutral-200">
                      <span
                        className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-neutral-600"
                        aria-hidden="true"
                      />
                      <span className="leading-snug">{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
