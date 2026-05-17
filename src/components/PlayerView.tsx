import { useAppState } from '../hooks/useAppState';
import { cn } from '../lib/utils';
import { Skull, Heart, ShieldAlert, BadgeInfo, Swords } from 'lucide-react';

export function PlayerView() {
  const { state: appState } = useAppState();
  const state = appState.combatState;

  const getHealthStatus = (current: number, max: number, type: 'pc' | 'npc') => {
    if (current <= 0) return { label: 'Defeated', color: 'text-red-700 opacity-60' };
    const ratio = current / max;
    if (ratio >= 0.9) return { label: 'Healthy', color: 'text-green-600' };
    if (ratio > 0.5) return { label: 'Injured', color: 'text-yellow-600' };
    return { label: 'Bloodied', color: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-[#2c2c26] p-4 md:p-8 font-serif flex flex-col items-center">
      
      <div className="w-full max-w-5xl mb-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#5a5a40] bg-white border border-[#e5e1d8] px-6 py-2 rounded-full shadow-sm">
          <BadgeInfo className="w-5 h-5 opacity-70" />
          <span className="text-sm uppercase tracking-widest font-sans font-bold">Round {state.round}</span>
        </div>
      </div>

      <div className="w-full max-w-5xl bg-white border border-[#e5e1d8] rounded-2xl shadow-sm overflow-hidden">
        {state.combatants.length === 0 ? (
          <div className="text-center text-[#5a5a40] italic py-16 flex flex-col items-center justify-center gap-3">
             <Swords className="w-8 h-8 opacity-20" />
            Peace reigns... for now.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f5f0] border-b border-[#e5e1d8] text-[#5a5a40] font-sans text-[10px] uppercase tracking-wider text-left">
                <th className="p-3 font-bold w-16 text-center">Init</th>
                <th className="p-3 font-bold">Combatant</th>
                <th className="p-3 font-bold text-center">Status</th>
                <th className="p-3 font-bold w-32 text-center">HP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f0] font-sans text-sm">
              {state.combatants.map((c) => {
                const isActive = c.id === state.activeTurnId;
                const health = getHealthStatus(c.currentHp, c.maxHp, c.type);
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
                    <td className="p-3">
                      <div className={cn(
                        "w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm border transition-all shadow-sm",
                        isActive ? "bg-[#c5b358] border-transparent text-white scale-110" : "bg-white border-[#e5e1d8] text-[#5a5a40]"
                      )}>
                        {c.initiative}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {isActive && <div className="w-2 h-2 rounded-full bg-[#c5b358]"></div>}
                        <div>
                          <div className={cn(
                            "font-bold text-base transition-colors",
                            isActive ? "text-[#c5b358]" : "text-[#2c2c26]",
                            isDead && "line-through text-[#5a5a40]"
                          )}>
                            {c.name.split(' ')[0]}
                          </div>
                          {c.conditions && (
                              <div className="text-[10px] text-red-600 font-bold italic mt-0.5">{c.conditions}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-[10px] uppercase tracking-wider">
                      <div className="flex justify-center">
                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f5f0]",
                          health.color
                        )}>
                          {isDead ? <Skull className="w-3 h-3" /> : (health.label === 'Healthy' ? <Heart className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />)}
                          {health.label}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {c.type === 'pc' && !isDead ? (
                        <div className="font-sans font-bold text-[#2c2c26]">
                          {c.currentHp} <span className="text-[#5a5a40] text-[10px] opacity-70">/ {c.maxHp}</span>
                        </div>
                      ) : (
                         <span className="text-[#5a5a40] opacity-50">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
