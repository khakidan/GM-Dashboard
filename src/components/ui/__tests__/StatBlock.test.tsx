import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StatBlock } from '../StatBlock';
import { AbilityScores, Proficiencies } from '../../../lib/abilityScores';

describe('StatBlock', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultScores: AbilityScores = {
    STR: 18,
    DEX: 14,
    CON: 16,
    INT: 10,
    WIS: 12,
    CHA: 8,
  };

  const defaultProficiencies: Proficiencies = {
    proficiencyBonus: 3,
    jackOfAllTrades: false,
    savingThrows: ['STR', 'CON'],
    skills: {
      Athletics: 'proficient',
      Perception: 'expertise',
    },
    passiveBonuses: {
      perception: 0,
      insight: 0,
      investigation: 0,
    },
  };

  describe('ABILITY SCORES DISPLAY', () => {
    it('renders all 6 ability score labels (STR, DEX, CON, INT, WIS, CHA)', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );

      expect(container.querySelector('#ability-box-str')).toBeInTheDocument();
      expect(container.querySelector('#ability-box-dex')).toBeInTheDocument();
      expect(container.querySelector('#ability-box-con')).toBeInTheDocument();
      expect(container.querySelector('#ability-box-int')).toBeInTheDocument();
      expect(container.querySelector('#ability-box-wis')).toBeInTheDocument();
      expect(container.querySelector('#ability-box-cha')).toBeInTheDocument();

      // Make sure the text label inside is correct
      expect(container.querySelector('#ability-box-str')).toHaveTextContent('STR');
      expect(container.querySelector('#ability-box-dex')).toHaveTextContent('DEX');
      expect(container.querySelector('#ability-box-con')).toHaveTextContent('CON');
      expect(container.querySelector('#ability-box-int')).toHaveTextContent('INT');
      expect(container.querySelector('#ability-box-wis')).toHaveTextContent('WIS');
      expect(container.querySelector('#ability-box-cha')).toHaveTextContent('CHA');
    });

    it('STR score 18 displays "+4" as modifier', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const strModifier = container.querySelector('#ability-modifier-str');
      expect(strModifier).toHaveTextContent('+4');
    });

    it('CHA score 8 displays "−1" as modifier (using minus sign, not hyphen)', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const chaModifier = container.querySelector('#ability-modifier-cha');
      expect(chaModifier).toHaveTextContent('\u22121'); // unicode minus sign
    });

    it('CON score 10 displays "0"', () => {
      const customScores = { ...defaultScores, CON: 10 };
      const { container } = render(
        <StatBlock
          abilityScores={customScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const conModifier = container.querySelector('#ability-modifier-con');
      expect(conModifier).toHaveTextContent('0');
    });
  });

  describe('SAVING THROWS', () => {
    it('all 6 ability names appear in saving throws section', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(container.querySelector('#saving-throw-label-str')).toHaveTextContent('STR');
      expect(container.querySelector('#saving-throw-label-dex')).toHaveTextContent('DEX');
      expect(container.querySelector('#saving-throw-label-con')).toHaveTextContent('CON');
      expect(container.querySelector('#saving-throw-label-int')).toHaveTextContent('INT');
      expect(container.querySelector('#saving-throw-label-wis')).toHaveTextContent('WIS');
      expect(container.querySelector('#saving-throw-label-cha')).toHaveTextContent('CHA');
    });

    it('STR (proficient, score 18, profBonus 3) shows "+7"', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(container.querySelector('#saving-throw-bonus-str')).toHaveTextContent('+7');
    });

    it('DEX (not proficient, score 14) shows "+2"', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(container.querySelector('#saving-throw-bonus-dex')).toHaveTextContent('+2');
    });
  });

  describe('SKILLS COLLAPSED', () => {
    it('Athletics (proficient) is visible', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const athleticsRow = container.querySelector('#skill-collapsed-athletics');
      expect(athleticsRow).toBeInTheDocument();
      expect(athleticsRow).toHaveTextContent('Athletics');
    });

    it('Perception (expertise) is visible with "(exp)" label', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const perceptionRow = container.querySelector('#skill-collapsed-perception');
      expect(perceptionRow).toBeInTheDocument();
      expect(perceptionRow).toHaveTextContent('Perception');
      expect(perceptionRow).toHaveTextContent('(exp)');
    });

    it('a skill NOT in the proficiencies object (e.g. Stealth) is NOT visible', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(container.querySelector('#skill-collapsed-stealth')).toBeNull();
    });

    it('"Skills" header renders', () => {
      render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });
  });

  describe('SKILLS EXPANDED', () => {
    it('clicking the expand chevron shows all 18 skill names', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );

      const expandBtn = container.querySelector('#skills-expand-btn');
      expect(expandBtn).not.toBeNull();
      fireEvent.click(expandBtn!);

      expect(container.querySelector('#skill-row-acrobatics')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-animal-handling')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-arcana')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-athletics')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-deception')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-history')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-insight')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-intimidation')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-investigation')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-medicine')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-nature')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-perception')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-performance')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-persuasion')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-religion')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-sleight-of-hand')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-stealth')).toBeInTheDocument();
      expect(container.querySelector('#skill-row-survival')).toBeInTheDocument();
    });
  });

  describe('PASSIVE SCORES', () => {
    it('"Passive Perception" text with calculated value appears (17)', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const passiveText = container.querySelector('#passive-scores-text');
      expect(passiveText).toHaveTextContent('Passive Perception: 17');
    });

    it('"Passive Insight" appears', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const passiveText = container.querySelector('#passive-scores-text');
      expect(passiveText).toHaveTextContent('Passive Insight:');
    });

    it('"Passive Investigation" appears', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const passiveText = container.querySelector('#passive-scores-text');
      expect(passiveText).toHaveTextContent('Passive Investigation:');
    });
  });

  describe('READ-ONLY MODE', () => {
    it('no number inputs for ability scores', () => {
      render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(screen.queryByRole('spinbutton')).toBeNull();
    });

    it('no toggle buttons for saving throws', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(container.querySelector('#saving-throw-btn-str')).toBeNull();
    });

    it('no skill cycling buttons', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      const expandBtn = container.querySelector('#skills-expand-btn');
      expect(expandBtn).not.toBeNull();
      fireEvent.click(expandBtn!);
      expect(container.querySelector('#skill-cycle-btn-athletics')).toBeNull();
    });

    it('Jack of All Trades checkbox absent', () => {
      render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={true}
        />
      );
      expect(screen.queryByLabelText(/Jack of All Trades/)).toBeNull();
    });
  });

  describe('EDIT MODE — ability scores', () => {
    it('number inputs rendered for all 6 ability scores', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={() => {}}
        />
      );
      expect(container.querySelector('#ability-score-str')).toBeInTheDocument();
      expect(container.querySelector('#ability-score-dex')).toBeInTheDocument();
      expect(container.querySelector('#ability-score-con')).toBeInTheDocument();
      expect(container.querySelector('#ability-score-int')).toBeInTheDocument();
      expect(container.querySelector('#ability-score-wis')).toBeInTheDocument();
      expect(container.querySelector('#ability-score-cha')).toBeInTheDocument();
    });

    it('changing STR input fires onChange with updated STR value', () => {
      const onChange = vi.fn();
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={onChange}
        />
      );

      const strInput = container.querySelector('#ability-score-str');
      expect(strInput).not.toBeNull();
      fireEvent.change(strInput!, { target: { value: '20' } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ STR: 20 }),
        defaultProficiencies
      );
    });
  });

  describe('EDIT MODE — saving throws', () => {
    it('clicking STR saving throw row calls onChange with STR removed from savingThrows', () => {
      const onChange = vi.fn();
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={onChange}
        />
      );

      const strBtn = container.querySelector('#saving-throw-btn-str');
      expect(strBtn).not.toBeNull();
      fireEvent.click(strBtn!);

      expect(onChange).toHaveBeenCalledWith(
        defaultScores,
        expect.objectContaining({
          savingThrows: ['CON'], // originally ['STR', 'CON']
        })
      );
    });

    it('clicking DEX saving throw row calls onChange with DEX added to savingThrows', () => {
      const onChange = vi.fn();
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={onChange}
        />
      );

      const dexBtn = container.querySelector('#saving-throw-btn-dex');
      expect(dexBtn).not.toBeNull();
      fireEvent.click(dexBtn!);

      expect(onChange).toHaveBeenCalledWith(
        defaultScores,
        expect.objectContaining({
          savingThrows: expect.arrayContaining(['STR', 'CON', 'DEX']),
        })
      );
    });
  });

  describe('EDIT MODE — skills', () => {
    it('in expanded view, clicking Athletics button cycles next and calls onChange', () => {
      const onChange = vi.fn();
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={onChange}
        />
      );

      const expandBtn = container.querySelector('#skills-expand-btn');
      expect(expandBtn).not.toBeNull();
      fireEvent.click(expandBtn!);

      const athleticsCycle = container.querySelector('#skill-cycle-btn-athletics');
      expect(athleticsCycle).not.toBeNull();
      fireEvent.click(athleticsCycle!);

      expect(onChange).toHaveBeenCalledWith(
        defaultScores,
        expect.objectContaining({
          skills: expect.objectContaining({
            Athletics: 'expertise',
          }),
        })
      );
    });

    it('Jack of All Trades checkbox renders and checking it calls onChange', () => {
      const onChange = vi.fn();
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={onChange}
        />
      );

      const expandBtn = container.querySelector('#skills-expand-btn');
      expect(expandBtn).not.toBeNull();
      fireEvent.click(expandBtn!);

      const checkbox = screen.getByLabelText(/Jack of All Trades/);
      expect(checkbox).toBeInTheDocument();

      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(
        defaultScores,
        expect.objectContaining({
          jackOfAllTrades: true,
        })
      );
    });
  });

  describe('PROFICIENCY BONUS', () => {
    it('characterLevel=5 shows "+3" calculated proficiency bonus', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={{ ...defaultProficiencies, proficiencyBonus: 0 }}
          characterLevel={5}
          readOnly={true}
        />
      );
      expect(container.querySelector('#proficiency-bonus-display')).toHaveTextContent('+3');
    });

    it('no characterLevel shows an editable input in edit mode', () => {
      const { container } = render(
        <StatBlock
          abilityScores={defaultScores}
          proficiencies={defaultProficiencies}
          readOnly={false}
          onChange={() => {}}
        />
      );
      expect(container.querySelector('#proficiency-bonus-input')).toBeInTheDocument();
    });
  });
});
