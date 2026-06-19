interface NotesSectionProps {
  notes: string;
}

// Notes are free-form text; lines matching "Label: value" render as named tags, the rest as plain paragraphs.
const NOTE_LINE_RE = /^([^:]+):\s*(.+)$/u;

export default function NotesSection({ notes }: NotesSectionProps) {
  const lines = notes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Заметки</h2>
      <div className="space-y-2.5">
        {lines.map((line, i) => {
          const match = line.match(NOTE_LINE_RE);
          if (match) {
            return (
              <p key={i} className="text-lg text-neutral-200">
                <span className="font-semibold text-amber-400">{match[1].trim()}:</span>{' '}
                {match[2].trim()}
              </p>
            );
          }
          return (
            <p key={i} className="text-lg leading-relaxed text-neutral-300">
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
