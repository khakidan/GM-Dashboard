import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IconButton } from './IconButton';
import { generateUuid } from '../../lib/uuid';

interface NpcListEditorProps<T extends { name: string; _key?: string }> {
  title: string;           // section header e.g. "Traits"
  items: T[];              // current parsed list
  emptyItem: T;            // template for a new blank entry
  renderFields: (
    item: T,
    index: number,
    onChange: (updated: T) => void
  ) => React.ReactNode;    // renders the fields for one entry
  onChange: (updated: T[]) => void; // fires with full updated list
}

export function NpcListEditor<T extends { name: string; _key?: string }>({
  title,
  items,
  emptyItem,
  renderFields,
  onChange,
}: NpcListEditorProps<T>) {
  const singularTitle = title.endsWith('s') ? title.slice(0, -1) : title;

  const handleAddItem = () => {
    // Deep copy emptyItem to avoid accidental references
    const newItem = JSON.parse(JSON.stringify(emptyItem)) as T;
    newItem._key = generateUuid();
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updatedItem: T) => {
    onChange(items.map((item, i) => (i === index ? updatedItem : item)));
  };

  return (
    <div className="border border-[#e2e8f0] rounded bg-[#f9f8ff] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8d8db9]">
          {title}
        </h4>
        <button
          type="button"
          onClick={handleAddItem}
          className="text-xs text-[#2563eb] hover:text-[#567eff] font-medium flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {singularTitle}
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item._key ?? index}
              className="bg-[#ffffff] rounded border border-[#e2e8f0] p-3 relative"
            >
              <IconButton
                icon={<Trash2 className="w-4 h-4" />}
                intent="destructive"
                onClick={() => handleRemoveItem(index)}
                aria-label={`Remove ${singularTitle}`}
                className="absolute top-2 right-2"
              />
              <div className="pr-6">
                {renderFields(item, index, (updated) =>
                  handleItemChange(index, updated)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
