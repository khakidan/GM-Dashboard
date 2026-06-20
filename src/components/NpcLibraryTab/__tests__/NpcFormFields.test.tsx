import { render, fireEvent, cleanup } from '@testing-library/react';
import { NpcFormFields, DEFAULT_NPC_FORM_DATA } from '../NpcFormFields';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcFormFields', () => {
  afterEach(cleanup);

  it('renders all fields', () => {
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={vi.fn()} />);
    
    expect(getByLabelText(/^NPC Name/i)).toBeDefined();
    expect(getByLabelText(/^AC\b/i)).toBeDefined();
    expect(getByLabelText(/^Max HP/i)).toBeDefined();
  });

  it('calls onChange when fields change', () => {
    let calledData: any = null;
    const onChange = (data: any) => {
      calledData = data;
    };
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />);

    const nameInput = getByLabelText(/^NPC Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test NPC' } });
    
    expect(calledData).not.toBeNull();
    expect(calledData.name).toBe('Test NPC');
  });
});
