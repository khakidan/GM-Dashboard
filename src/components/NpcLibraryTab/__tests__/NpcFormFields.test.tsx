import { render, fireEvent, cleanup } from '@testing-library/react';
import { NpcFormFields, DEFAULT_NPC_FORM_DATA } from '../../ui/NpcFormFields';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcFormFields', () => {
  afterEach(cleanup);

  it('renders all fields', () => {
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={vi.fn()} />);
    
    expect(getByLabelText(/^NPC Name/i)).toBeDefined();
    expect(getByLabelText(/^AC\b/i)).toBeDefined();
    expect(getByLabelText(/^Max HP/i)).toBeDefined();
    expect(getByLabelText(/^CR/i)).toBeDefined();
    expect(getByLabelText(/^Speed/i)).toBeDefined();
    expect(getByLabelText(/^Senses/i)).toBeDefined();
    expect(getByLabelText(/^Languages/i)).toBeDefined();
  });

  it('calls onChange when fields change', () => {
    let calledData: any = null;
    const onChange = (data: any) => {
      calledData = data;
    };
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />);

    const nameInput = getByLabelText(/^NPC Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test NPC' } });
    expect(calledData.name).toBe('Test NPC');

    const crInput = getByLabelText(/^CR/i);
    fireEvent.change(crInput, { target: { value: '1/2' } });
    expect(calledData.challengeRating).toBe('1/2');

    const speedInput = getByLabelText(/^Speed/i);
    fireEvent.change(speedInput, { target: { value: '40 ft.' } });
    fireEvent.blur(speedInput);
    expect(calledData.speed).toBe('40 ft.');

    const sensesInput = getByLabelText(/^Senses/i);
    fireEvent.change(sensesInput, { target: { value: 'darkvision' } });
    fireEvent.blur(sensesInput);
    expect(calledData.senses).toBe('darkvision');

    const languagesInput = getByLabelText(/^Languages/i);
    fireEvent.change(languagesInput, { target: { value: 'Elvish' } });
    fireEvent.blur(languagesInput);
    expect(calledData.languages).toBe('Elvish');
  });

  it('StatBlock renders in NpcFormFields', () => {
    const { container } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={vi.fn()} />);
    const strInput = container.querySelector('#ability-score-str') as HTMLInputElement;
    expect(strInput).toBeDefined();
    expect(strInput?.value).toBe('10'); // Default STR is 10
  });

  it('Changing a StatBlock value calls onChange with updated abilityScores in the data object', () => {
    let calledData: any = null;
    const onChange = (data: any) => {
      calledData = data;
    };
    const { container } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />);
    const strInput = container.querySelector('#ability-score-str') as HTMLInputElement;

    fireEvent.change(strInput!, { target: { value: '15' } });
    fireEvent.blur(strInput!);

    expect(calledData).not.toBeNull();
    expect(calledData.abilityScores).toContain('"STR":15');
  });

  it('handles traits addition and updates', () => {
    let calledData: any = null;
    const onChange = (data: any) => {
      calledData = data;
    };
    const { getByText } = render(
      <NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />
    );

    const addTraitButton = getByText('Add Trait');
    fireEvent.click(addTraitButton);

    expect(calledData).not.toBeNull();
    const parsedTraits = JSON.parse(calledData.traits);
    expect(parsedTraits.length).toBe(1);
    expect(parsedTraits[0].name).toBe('');

    const existingTraitsData = {
      ...DEFAULT_NPC_FORM_DATA,
      traits: JSON.stringify([{ name: 'Keen Smell', description: 'Advantage on smell.' }]),
    };

    const { getByDisplayValue } = render(
      <NpcFormFields data={existingTraitsData} onChange={onChange} />
    );

    const traitNameInput = getByDisplayValue('Keen Smell');
    fireEvent.change(traitNameInput, { target: { value: 'Keen Sight' } });

    expect(calledData).not.toBeNull();
    const updatedTraits = JSON.parse(calledData.traits);
    expect(updatedTraits[0].name).toBe('Keen Sight');
  });

  it('handles actions addition and updates', () => {
    let calledData: any = null;
    const onChange = (data: any) => {
      calledData = data;
    };
    const { getByText } = render(
      <NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />
    );

    const addActionButton = getByText('Add Action');
    fireEvent.click(addActionButton);

    expect(calledData).not.toBeNull();
    const parsedActions = JSON.parse(calledData.actions);
    expect(parsedActions.length).toBe(1);
    expect(parsedActions[0].name).toBe('');

    const existingActionsData = {
      ...DEFAULT_NPC_FORM_DATA,
      actions: JSON.stringify([{ name: 'Bite', description: 'Bites target.', attackBonus: 5 }]),
    };

    const { getByDisplayValue } = render(
      <NpcFormFields data={existingActionsData} onChange={onChange} />
    );

    const actionNameInput = getByDisplayValue('Bite');
    fireEvent.change(actionNameInput, { target: { value: 'Claw' } });

    expect(calledData).not.toBeNull();
    const updatedActions = JSON.parse(calledData.actions);
    expect(updatedActions[0].name).toBe('Claw');
  });
});
