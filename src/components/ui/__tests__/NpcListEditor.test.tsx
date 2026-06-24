import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcListEditor } from '../NpcListEditor';

interface TestItem {
  name: string;
  description: string;
}

describe('NpcListEditor', () => {
  afterEach(cleanup);

  const emptyItem: TestItem = { name: '', description: '' };

  const renderFields = (
    item: TestItem,
    index: number,
    onChange: (updated: TestItem) => void
  ) => (
    <div data-testid={`item-${index}`}>
      <input
        type="text"
        placeholder="Name"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
      />
    </div>
  );

  it('renders with title and adds a new item', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <NpcListEditor<TestItem>
        title="Traits"
        items={[]}
        emptyItem={emptyItem}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    expect(getByText('Traits')).toBeDefined();
    
    const addButton = getByText('Add Trait');
    expect(addButton).toBeDefined();

    fireEvent.click(addButton);
    expect(onChange).toHaveBeenCalledWith([{ name: '', description: '' }]);
  });

  it('renders existing items and calls onChange when edited', () => {
    const onChange = vi.fn();
    const items: TestItem[] = [
      { name: 'Keen Smell', description: 'Advantage on smell checks.' },
    ];

    const { getByPlaceholderText } = render(
      <NpcListEditor<TestItem>
        title="Traits"
        items={items}
        emptyItem={emptyItem}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    const nameInput = getByPlaceholderText('Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Keen Smell');

    fireEvent.change(nameInput, { target: { value: 'Keen Hearing' } });
    expect(onChange).toHaveBeenCalledWith([
      { name: 'Keen Hearing', description: 'Advantage on smell checks.' },
    ]);
  });

  it('removes an item when the remove button is clicked', () => {
    const onChange = vi.fn();
    const items: TestItem[] = [
      { name: 'Trait 1', description: 'Desc 1' },
      { name: 'Trait 2', description: 'Desc 2' },
    ];

    const { getAllByLabelText } = render(
      <NpcListEditor<TestItem>
        title="Traits"
        items={items}
        emptyItem={emptyItem}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    const removeButtons = getAllByLabelText('Remove Trait');
    expect(removeButtons.length).toBe(2);
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith([
      { name: 'Trait 2', description: 'Desc 2' },
    ]);
  });
});
