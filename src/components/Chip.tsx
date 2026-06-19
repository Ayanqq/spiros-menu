import type { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  variant?: 'default' | 'amber';
}

export default function Chip({ children, variant = 'default' }: ChipProps) {
  const variantClasses =
    variant === 'amber'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      : 'bg-neutral-800 text-neutral-300 border-neutral-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${variantClasses}`}>
      {children}
    </span>
  );
}
