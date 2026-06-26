import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { NpcFormFields, DEFAULT_NPC_FORM_DATA } from '../../ui/NpcFormFields';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcFormFields', () => {
  afterEach(() => cleanup());

  it('renders all essential fields', () => {
    const { getByLabelText, getByRole } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={vi.fn()} />);
    
    expect(getByLabelText(/^NPC Name/i)).toBeInTheDocument();
    expect(getByLabelText(/^CR/i)).toBeInTheDocument();

    fireEvent.click(getByRole('button', { name: 'Combat' }));
    expect(getByLabelText(/^AC\b/i)).toBeInTheDocument();
    expect(getByLabelText(/^Max HP/i)).toBeInTheDocument();
  });

  it('calls onChange when input values change', () => {
    let calledData: any = null;
    const onChange = (data: any) => { calledData = data; };
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />);

    const nameInput = getByLabelText(/^NPC Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test NPC' } });
    
    expect(calledData).not.toBeNull();
    expect(calledData.name).toBe('Test NPC');
  });
});
