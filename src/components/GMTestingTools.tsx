// src/components/GMTestingTools.tsx

import { Skull, Zap, Heart, Moon, Flame, Dice6 } from 'lucide-react';
import { toast } from 'sonner';

interface GMTestingToolsProps {
  fireDeathEvent: (payload: { characterName: string }) => void;
  fireDamageEvent: (payload: { combatantNames: string[]; damageAmount: number; damageType?: string }) => void;
  fireHealEvent: (payload: { combatantNames: string[]; healAmount: number }) => void;
  fireUnconsciousEvent: (payload: { characterName: string }) => void;
  fireRageEvent: (payload: { characterName: string }) => void;
  fireInitiativeEvent: (isActive: boolean) => void;
}

export function GMTestingTools({
  fireDeathEvent,
  fireDamageEvent,
  fireHealEvent,
  fireUnconsciousEvent,
  fireRageEvent,
  fireInitiativeEvent,
}: GMTestingToolsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4" id="gm-tools-testing-section">
      <div>
        <h3 className="text-lg font-bold text-[#2c2c26] font-serif pb-1">GM Tools & Testing</h3>
        <p className="text-xs text-[#5a5a40]">
          Utility actions for testing presentation effects and validating active overlays.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          id="test-death-animation-btn"
          type="button"
          onClick={() => {
            fireDeathEvent({ characterName: 'Aldric the Brave' });
            toast('Death animation triggered', {
              description: 'Check the Player View to see the overlay.',
              duration: 3000,
            });
          }}
          className="border border-[#e5e1d8] hover:bg-[#fcfbf9] text-[#5a5a40] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Skull className="w-4 h-4" />
          Test Death Animation
        </button>

        <button
          id="test-damage-animation-btn"
          type="button"
          onClick={() => {
            fireDamageEvent({ combatantNames: ['Thorin Ironforge'], damageAmount: 47 });
            toast('Damage animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#e5e1d8] hover:bg-[#fcfbf9] text-[#5a5a40] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Test Damage Animation
        </button>

        <button
          id="test-heal-animation-btn"
          type="button"
          onClick={() => {
            fireHealEvent({ combatantNames: ['Seraphina Brightwell'], healAmount: 34 });
            toast('Heal animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#eef5e6] bg-[#f8fbf5] hover:bg-[#f2f8ec] text-[#2e5a2c] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Heart className="w-4 h-4" />
          Test Heal Animation
        </button>

        <button
          id="test-unconscious-animation-btn"
          type="button"
          onClick={() => {
            fireUnconsciousEvent({ characterName: 'Gareth of Stonehaven' });
            toast('Unconscious animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Moon className="w-4 h-4" />
          Test Unconscious Animation
        </button>

        <button
          id="test-rage-animation-btn"
          type="button"
          onClick={() => {
            fireRageEvent({ characterName: 'Bjorn the Unbroken' });
            toast('Rage animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#ffcdce] bg-[#fff5f5] hover:bg-[#ffeded] text-[#9b2c2c] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Flame className="w-4 h-4" />
          Test Rage Animation
        </button>

        <button
          id="test-initiative-animation-btn"
          type="button"
          onClick={() => {
            fireInitiativeEvent(true);
            toast('Toggle initiative animation');
          }}
          className="border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-700 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Dice6 className="w-4 h-4" />
          Test Initiative Animation
        </button>
      </div>
    </div>
  );
}
