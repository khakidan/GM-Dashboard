import { useAppState } from '../hooks/useAppState';
import { cn } from '../lib/utils';
import { Skull, Heart, ShieldAlert, Shield, Swords } from 'lucide-react';
import { getHealthStatus } from '../lib/combatLogic';

export function PlayerView() {
  const { state: appState } = useAppState();
  const state = appState.combatState;

  if (!state.activeEncounterId) {
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
          <tr className="bg-[#f5f5f0] border-b border-[#e5e1d8] text-[#5a5a40] font-sans text-xs uppercase tracking-widest text-left">
            <th className="p-3 font-bold w-14 text-center border-r border-[#e5e1d8]">Init</th>
            <th className="p-3 font-bold px-4">Combatant</th>
            <th className="p-3 font-bold text-center">Status</th>
            <th className="p-3 font-bold w-24 text-center">HP</th>
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
                <td className="p-3 border-r border-[#f5f5f0]">
                  <div className={cn(
                    "w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-base border transition-all shadow-sm",
                    isActive ? "bg-[#c5b358] border-transparent text-white scale-110" : "bg-white border-[#e5e1d8] text-[#5a5a40]"
                  )}>
                    {c.initiative}
                  </div>
                </td>
                <td className="p-4 px-5">
                  <div className="flex items-center gap-3">
                    {isActive && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
                    <div className="min-w-0">
                      <div className={cn(
                        "font-bold text-base md:text-lg truncate transition-colors",
                        isActive ? "text-[#c5b358]" : "text-[#2c2c26]",
                        isDead && "line-through text-[#5a5a40]"
                      )}>
                        {c.name}
                      </div>
                      {c.conditions && (
                          <div className="text-xs text-red-600 font-bold italic mt-1 truncate max-w-[150px]" title={c.conditions}>{c.conditions}</div>
                      )}
                      {c.type === 'pc' && c.conditions?.toLowerCase().includes('unconscious') && (c.deathSavesSuccesses || 0) < 3 && !c.isStable && (
                        <div className="flex flex-col gap-0.5 mt-2 bg-rose-50/70 border border-rose-100 rounded-lg px-2 py-1 text-[11px] max-w-[160px]">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-[#5a5a40] font-bold uppercase text-[9px] w-12">Fails:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(slot => {
                                const isFailed = (c.deathSavesFails || 0) >= slot;
                                return (
                                  <span key={slot} className={cn("text-xs leading-none", isFailed ? "text-red-500" : "text-gray-300")}>
                                    {isFailed ? "●" : "○"}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-[#5a5a40] font-bold uppercase text-[9px] w-12">Successs:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(slot => {
                                const isSuccess = (c.deathSavesSuccesses || 0) >= slot;
                                return (
                                  <span key={slot} className={cn("text-xs leading-none", isSuccess ? "text-green-500" : "text-gray-300")}>
                                    {isSuccess ? "♥" : "○"}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3 font-bold text-xs uppercase tracking-wider">
                  <div className="flex justify-center">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f0]",
                      health.color
                    )}>
                      {isDead ? <Skull className="w-3.5 h-3.5" /> : (['Full', 'Healthy'].includes(health.label) ? <Heart className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />)}
                      <span className="hidden sm:inline">{health.label}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center text-sm md:text-base">
                  {c.type === 'pc' && !isDead ? (
                    <div className="font-sans font-bold text-[#2c2c26]">
                      {c.currentHp} <span className="text-[#5a5a40] opacity-70">/ {c.maxHp}</span>
                    </div>
                  ) : (
                     <span className="text-[#5a5a40] opacity-50 font-bold">-</span>
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
      
      <div className="w-full max-w-7xl mb-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#5a5a40] bg-white border border-[#e5e1d8] px-6 py-2 rounded-full shadow-sm">
          <Shield className="w-5 h-5 opacity-70" />
          <span className="text-sm uppercase tracking-widest font-sans font-bold">Round {state.round}</span>
        </div>
      </div>

      <div className={cn(
        "w-full",
        useTwoCols ? "max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6" : "max-w-4xl"
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
