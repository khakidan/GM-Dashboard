// src/components/VisualSuiteSelector.tsx

interface VisualSuiteSelectorProps {
  theme: string;
  setTheme: (theme: string) => void;
}

export function VisualSuiteSelector({ theme, setTheme }: VisualSuiteSelectorProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">Visual Suite Styles</h3>
        <p className="text-xs text-[#5a5a40]">
          Choose one polished visual preset to instantly transform layout elements, typography pairings, borders, and interactive micro-animations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="visual-style-switcher-grid">
        <button
          id="theme-btn-default"
          type="button"
          onClick={() => setTheme('default')}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
            theme === 'default'
              ? 'border-[#c5b358] bg-[#f5f5f0] shadow-sm font-semibold ring-2 ring-[#c5b358]/20'
              : 'border-[#e5e1d8] bg-stone-50/50 hover:bg-stone-50'
          }`}
        >
          <div>
            <div className="text-sm font-bold font-sans text-stone-900">Style 1: Default</div>
            <div className="text-xs text-[#5a5a40]/80 mt-1">Classic golden parchment layout</div>
          </div>
          {theme === 'default' && <div className="w-3 h-3 rounded-full bg-[#c5b358]" />}
        </button>

        <button
          id="theme-btn-dnd"
          type="button"
          onClick={() => setTheme('dnd')}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
            theme === 'dnd'
              ? 'border-amber-700 bg-amber-100 shadow-sm font-semibold ring-2 ring-amber-700/20'
              : 'border-[#e5e1d8] bg-stone-50/50 hover:bg-stone-50'
          }`}
        >
          <div>
            <div className="text-sm font-bold font-serif text-amber-900">Classic D&D Adventure</div>
            <div className="text-xs text-amber-700 mt-1">Warm leather & medieval gold</div>
          </div>
          {theme === 'dnd' && <div className="w-3 h-3 rounded-full bg-amber-700" />}
        </button>

        <button
          id="theme-btn-sleek-modern"
          type="button"
          onClick={() => setTheme('sleek-modern')}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
            theme === 'sleek-modern'
              ? 'border-indigo-600 bg-indigo-50 shadow-sm font-semibold ring-2 ring-indigo-600/20'
              : 'border-[#e5e1d8] bg-stone-50/50 hover:bg-stone-50'
          }`}
        >
          <div>
            <div className="text-sm font-bold font-sans text-indigo-950">Minimalist Sleek</div>
            <div className="text-xs text-indigo-800 mt-1">Sleek styling and modern interfaces</div>
          </div>
          {theme === 'sleek-modern' && <div className="w-3 h-3 rounded-full bg-indigo-600" />}
        </button>
      </div>
    </div>
  );
}
