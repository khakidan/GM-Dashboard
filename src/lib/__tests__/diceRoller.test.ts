import { expect, it, describe, vi, beforeEach, afterEach } from 'vitest';
import { parseDiceNotation, rollDice } from '../diceRoller';

describe('Dice Roller Parser', () => {
  it("parseDiceNotation('2d6') returns count 2, sides 6, no modifier", () => {
    const parsed = parseDiceNotation('2d6');
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].count).toBe(2);
    expect(parsed.groups[0].sides).toBe(6);
    expect(parsed.modifier).toBe(0);
    expect(parsed.advantage).toBe(false);
    expect(parsed.disadvantage).toBe(false);
    expect(parsed.dropLowest).toBe(false);
  });

  it("parseDiceNotation('1d20+5') returns modifier 5", () => {
    const parsed = parseDiceNotation('1d20+5');
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].count).toBe(1);
    expect(parsed.groups[0].sides).toBe(20);
    expect(parsed.modifier).toBe(5);
  });

  it("parseDiceNotation('1d20 adv') sets advantage: true", () => {
    const parsed = parseDiceNotation('1d20 adv');
    expect(parsed.advantage).toBe(true);
    expect(parsed.disadvantage).toBe(false);
  });

  it("parseDiceNotation('4d6 drop') sets dropLowest: true", () => {
    const parsed = parseDiceNotation('4d6 drop');
    expect(parsed.dropLowest).toBe(true);
  });

  it("parseDiceNotation('d20') treated as 1d20", () => {
    const parsed = parseDiceNotation('d20');
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].count).toBe(1);
    expect(parsed.groups[0].sides).toBe(20);
  });

  it("parseDiceNotation('invalid!!!') returns null or throws a descriptive error", () => {
    expect(() => parseDiceNotation('invalid!!!')).toThrow();
  });
});

describe('Dice Roller Rolling Engine', () => {
  let mathRandomSpy: any;

  beforeEach(() => {
    mathRandomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  it("rollDice with 1d6 returns a total between 1-6", () => {
    mathRandomSpy.mockReturnValue(0.5); // (0.5 * 6) + 1 = 4
    const parsed = parseDiceNotation('1d6');
    const result = rollDice(parsed);
    expect(result.total).toBe(4);
    expect(result.groups[0].rolls).toEqual([4]);
    expect(result.groups[0].kept).toEqual([4]);
  });

  it("rollDice with 2d6 returns a total between 2-12", () => {
    mathRandomSpy
      .mockReturnValueOnce(0.1) // 1.6 -> 1
      .mockReturnValueOnce(0.9); // 6.4 -> 6
    const parsed = parseDiceNotation('2d6');
    const result = rollDice(parsed);
    expect(result.total).toBe(7);
    expect(result.groups[0].rolls).toEqual([1, 6]);
    expect(result.groups[0].kept).toEqual([1, 6]);
  });

  it("rollDice with advantage returns the higher of two d20 rolls", () => {
    // advantage of 1d20 means rolling 2 dice and keeping the highest
    mathRandomSpy
      .mockReturnValueOnce(0.24) // (0.24 * 20)+1 = 5
      .mockReturnValueOnce(0.84); // (0.84 * 20)+1 = 17
    const parsed = parseDiceNotation('1d20 adv');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([5, 17]);
    expect(result.groups[0].kept).toEqual([17]);
    expect(result.total).toBe(17);
  });

  it("rollDice with disadvantage returns the lower of two d20 rolls", () => {
    mathRandomSpy
      .mockReturnValueOnce(0.24) // 5
      .mockReturnValueOnce(0.84); // 17
    const parsed = parseDiceNotation('1d20 dis');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([5, 17]);
    expect(result.groups[0].kept).toEqual([5]);
    expect(result.total).toBe(5);
  });

  it("rollDice with 4d6 drop returns kept array of length 3 (one dropped)", () => {
    mathRandomSpy
      .mockReturnValueOnce(0.5) // (0.5 * 6) + 1 = 4
      .mockReturnValueOnce(0.1) // 1
      .mockReturnValueOnce(0.9) // 6
      .mockReturnValueOnce(0.7); // 5
    const parsed = parseDiceNotation('4d6 drop');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([4, 1, 6, 5]);
    expect(result.groups[0].kept).toEqual([4, 5, 6]); // sorts kept to drop 1 (lowest)
    expect(result.total).toBe(15);
  });

  it("rollDice with +5 modifier adds 5 to total", () => {
    mathRandomSpy.mockReturnValueOnce(0.45); // (0.45 * 20) + 1 = 10
    const parsed = parseDiceNotation('1d20+5');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([10]);
    expect(result.modifier).toBe(5);
    expect(result.total).toBe(15);
  });
});
