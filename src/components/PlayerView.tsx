import { getHealthStatus } from '../lib/conditions';
import { useAppState } from '../hooks/useAppState';
import { cn } from '../lib/utils';
import { Skull, Heart, ShieldAlert, Shield, Swords } from 'lucide-react';
;

export function PlayerView() {
  const { state: appState } = useAppState();
  const state = appState.combatState;

  if (!state.activeEncounterId || state.combatants.length === 0) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] text-[#2c2c26] p-4 md:p-8 font-serif flex flex-col items-center justify-center">
        <div className="bg-white border border-[#e5e1d8] rounded-2xl text-center text-[#5a5a40] italic py-24 px-8 max-w-md flex flex-col items-center justify-center gap-3 shadow-sm">
          <Swords className="w-12 h-12 opacity-20" />
          <p className="font-sans font-bold uppercase tracking-widest text-[#5a5a40] text-xs">Waiting for GM to start the encounter...</p>
          <p className="font-sans text-xs text-[#5a5a40] opacity-70">The GM has not activated combat yet. Standby...</p>
        </div>
      </div>
    );
  }

  const renderTable = (combatants: typeof state.combatants, isSecondary: boolean = false) => (
    <div className="bg-white border border-[#e5e1d8] rounded-2xl shadow-sm overflow-hidden h-fit">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f5f5f0] border-b border-[#e5e1d8] text-[#5a5a40] font-sans text-sm uppercase tracking-widest text-left">
            <th className="p-4 font-bold w-16 text-center border-r border-[#e5e1d8]">Init</th>
            <th className="p-4 font-bold px-6">Combatant</th>
            <th className="p-4 font-bold text-center">Status</th>
            <th className="p-4 font-bold w-28 text-center min-w-[7rem]">HP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f5f5f0] font-sans text-base">
          {combatants.map((c) => {
            const isActive = c.id === state.activeTurnId;
            const health = getHealthStatus(c.currentHp, c.maxHp);
            const isDead = c.currentHp <= 0;

            return (
              <tr 
                key={c.id} 
                className={cn(
                  "transition-colors",
                  isActive ? "bg-[#fcfbf9]" : "bg-white",
                  isDead && "opacity-60"
                )}
              >
                <td className="p-4 border-r border-[#f5f5f0]">
                  <div className={cn(
                    "w-11 h-11 mx-auto rounded-full flex items-center justify-center font-bold text-xl border transition-all shadow-sm",
                    isActive ? "bg-[#c5b358] border-transparent text-white scale-110" : "bg-white border-[#e5e1d8] text-[#5a5a40]"
                  )}>
                    {c.initiative}
                  </div>
                </td>
                <td className="p-4 px-5">
                  <div className="flex flex-col items-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className={cn(
                            "font-bold text-xl md:text-2xl truncate transition-colors",
                            isActive ? "text-[#c5b358]" : "text-[#2c2c26]",
                            isDead && "line-through text-[#5a5a40]"
                          )}>
                            {c.name}
                          </span>
                        </div>
                        {c.conditions && (
                            <div className="text-sm text-red-600 font-bold italic mt-1 truncate max-w-[200px]" title={c.conditions}>{c.conditions}</div>
                        )}
                      </div>
                    </div>
                    {c.type === 'pc' && c.conditions?.toLowerCase().includes('unconscious') && (c.deathSavesSuccesses || 0) < 3 && !c.isStable && (
                      <div className="flex flex-col gap-2 mt-1 select-none shrink-0">
                        <div className="flex items-center gap-4 text-xl md:text-2xl font-bold font-sans">
                          <span className="text-red-800 uppercase tracking-wide min-w-[120px] md:min-w-[145px]">FAILS</span>
                          <div className="flex gap-2">
                            {[1, 2, 3].map(slot => {
                              const isFailed = (c.deathSavesFails || 0) >= slot;
                              return (
                                <span key={slot} className={cn("leading-none", isFailed ? "text-red-600" : "text-gray-300")}>
                                  {isFailed ? "●" : "○"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xl md:text-2xl font-bold font-sans">
                          <span className="text-emerald-800 uppercase tracking-wide min-w-[120px] md:min-w-[145px]">SUCCESSES</span>
                          <div className="flex gap-2">
                            {[1, 2, 3].map(slot => {
                              const isSuccess = (c.deathSavesSuccesses || 0) >= slot;
                              return (
                                <span key={slot} className={cn("leading-none", isSuccess ? "text-emerald-600" : "text-gray-300")}>
                                  {isSuccess ? "♥" : "○"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 font-bold text-sm uppercase tracking-wider">
                  <div className="flex justify-center">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f5f0]",
                      health.color
                    )}>
                      {isDead ? <Skull className="w-4 h-4" /> : (['Full', 'Healthy'].includes(health.label) ? <Heart className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />)}
                      <span className="hidden sm:inline">{health.label}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center text-lg md:text-xl min-w-[7rem] whitespace-nowrap">
                  {c.type === 'pc' && !isDead ? (
                    <div className="font-sans font-bold text-[#2c2c26] whitespace-nowrap">
                      {c.currentHp} <span className="text-[#5a5a40] opacity-70">/ {c.maxHp}</span>
                    </div>
                  ) : (
                    <span className="text-[#5a5a40] opacity-50 font-bold text-base">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const useTwoCols = state.combatants.length > 10;
  const firstHalf = useTwoCols ? state.combatants.slice(0, Math.ceil(state.combatants.length / 2)) : state.combatants;
  const secondHalf = useTwoCols ? state.combatants.slice(Math.ceil(state.combatants.length / 2)) : [];

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-[#2c2c26] p-4 md:p-8 font-serif flex flex-col items-center">
      
      <div className="w-full max-w-7xl mb-8 flex items-center justify-center">
        <div className="flex items-center gap-4 text-[#5a5a40] bg-white border border-[#e5e1d8] px-8 py-3 rounded-full shadow-sm">
          <Shield className="w-6 h-6 opacity-70" />
          <span className="text-base uppercase tracking-widest font-sans font-bold">Round {state.round}</span>
        </div>
      </div>

      <div className={cn(
        "w-full max-w-7xl",
        useTwoCols && "grid grid-cols-1 lg:grid-cols-2 gap-6"
      )}>
        {state.combatants.length === 0 ? (
          <div className="col-span-full bg-white border border-[#e5e1d8] rounded-2xl text-center text-[#5a5a40] italic py-24 flex flex-col items-center justify-center gap-3 shadow-sm">
             <Swords className="w-12 h-12 opacity-20" />
             <p className="font-sans font-bold uppercase tracking-widest text-xs">Peace reigns... for now.</p>
          </div>
        ) : (
          <>
            {renderTable(firstHalf)}
            {useTwoCols && renderTable(secondHalf, true)}
          </>
        )}
      </div>

    </div>
  );
}
