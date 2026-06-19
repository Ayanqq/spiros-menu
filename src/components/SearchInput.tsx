interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchInput({ value, onChange, placeholder, autoFocus }: SearchInputProps) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      <input
        type="search"
        inputMode="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Поиск...'}
        className="w-full rounded-2xl bg-neutral-900 border border-neutral-700 pl-12 pr-4 py-4 text-lg text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition"
      />
    </div>
  );
}
