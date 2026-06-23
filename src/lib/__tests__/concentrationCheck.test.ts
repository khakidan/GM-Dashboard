import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  concentrationCheckDc,
  isConcentrating,
  fireConcentrationAlert,
  isIncapacitating,
} from '../concentrationCheck';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('concentrationCheckDc', () => {
  it('damage 0 returns 0 (no check)', () => {
    expect(concentrationCheckDc(0)).toBe(0);
  });

  it('damage 1 returns 10 (half=0, min 10)', () => {
    expect(concentrationCheckDc(1)).toBe(10);
  });

  it('damage 8 returns 10 (half=4, min 10)', () => {
    expect(concentrationCheckDc(8)).toBe(10);
  });

  it('damage 19 returns 10 (half=9, min 10)', () => {
    expect(concentrationCheckDc(19)).toBe(10);
  });

  it('damage 20 returns 10 (half=10, min 10)', () => {
    expect(concentrationCheckDc(20)).toBe(10);
  });

  it('damage 21 returns 10 (half=10, min 10)', () => {
    expect(concentrationCheckDc(21)).toBe(10);
  });

  it('damage 22 returns 11 (half=11)', () => {
    expect(concentrationCheckDc(22)).toBe(11);
  });

  it('damage 40 returns 20 (half=20)', () => {
    expect(concentrationCheckDc(40)).toBe(20);
  });

  it('damage 100 returns 50 (half=50)', () => {
    expect(concentrationCheckDc(100)).toBe(50);
  });

  it('negative damage returns 0', () => {
    expect(concentrationCheckDc(-5)).toBe(0);
  });
});

describe('isConcentrating', () => {
  it('"concentrating" returns true', () => {
    expect(isConcentrating('concentrating')).toBe(true);
  });

  it('"Concentrating" returns true (case insensitive)', () => {
    expect(isConcentrating('Concentrating')).toBe(true);
  });

  it('"poisoned, concentrating, hasted" returns true', () => {
    expect(isConcentrating('poisoned, concentrating, hasted')).toBe(true);
  });

  it('"poisoned, hasted" returns false', () => {
    expect(isConcentrating('poisoned, hasted')).toBe(false);
  });

  it('empty string returns false', () => {
    expect(isConcentrating('')).toBe(false);
  });

  it('undefined-like empty returns false', () => {
    expect(isConcentrating(undefined as any)).toBe(false);
  });

  it('"concentration" returns false (must be exact word)', () => {
    expect(isConcentrating('concentration')).toBe(false);
  });
});

describe('fireConcentrationAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Calls toast.warning with the creature name in the title', () => {
    fireConcentrationAlert('Alys', 15);
    expect(toast.warning).toHaveBeenCalledWith(
      'Concentration Check — Alys',
      expect.any(Object)
    );
  });

  it('Calls toast.warning with the correct DC in the description and duration is 10000ms', () => {
    fireConcentrationAlert('Melf', 10);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('DC 10'),
        duration: 10000,
        icon: '🎯',
      })
    );
  });

  it('22 damage produces "DC 11" in the description', () => {
    fireConcentrationAlert('Maeve', 22);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('DC 11'),
      })
    );
  });

  it('8 damage produces "DC 10" and "(min DC 10)" in the description', () => {
    fireConcentrationAlert('Terry', 8);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('DC 10'),
      })
    );
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('(min DC 10)'),
      })
    );
  });
});

describe('isIncapacitating', () => {
  it('stunned returns true', () => {
    expect(isIncapacitating('stunned')).toBe(true);
  });

  it('paralyzed returns true', () => {
    expect(isIncapacitating('paralyzed')).toBe(true);
  });

  it('unconscious returns true', () => {
    expect(isIncapacitating('unconscious')).toBe(true);
  });

  it('poisoned returns false', () => {
    expect(isIncapacitating('poisoned')).toBe(false);
  });

  it('blinded returns false', () => {
    expect(isIncapacitating('blinded')).toBe(false);
  });

  it('STUNNED returns true (case insensitive)', () => {
    expect(isIncapacitating('STUNNED')).toBe(true);
  });

  it('unknown returns false', () => {
    expect(isIncapacitating('unknown')).toBe(false);
  });
});
