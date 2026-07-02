const icons: Record<string, React.ReactNode> = {
  bed: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  ),
  spa: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c1.5 3 4.5 4.5 4.5 7.5a4.5 4.5 0 01-9 0C7.5 7.5 10.5 6 12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h8M6 18h12" />
    </svg>
  ),
  pool: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
    </svg>
  ),
  bike: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="5.5" cy="17.5" r="3.5" strokeWidth={1.5} />
      <circle cx="18.5" cy="17.5" r="3.5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.5h5M12 17.5l3-7 3 1 2-4" />
    </svg>
  ),
  home: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  wifi: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M3.055 11.065a9.5 9.5 0 0117.89 0M5.636 13.828a7 7 0 009.728 0" />
    </svg>
  ),
};

export function HighlightIcon({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
      {icons[name] ?? icons.home}
    </div>
  );
}

export function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl text-white">{value}</p>
      <p className="mt-1 text-sm text-sage-200">{label}</p>
    </div>
  );
}
