import React from 'react';
import { Plus, X } from 'lucide-react';

interface NpcListEditorProps<T extends { name: string }> {
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

export function NpcListEditor<T extends { name: string }>({
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
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updatedItem: T) => {
    onChange(items.map((item, i) => (i === index ? updatedItem : item)));
  };

  return (
    <div className="border border-[#e5e1d8] rounded bg-[#f5f1e8] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5a5a40]">
          {title}
        </h4>
        <button
          type="button"
          onClick={handleAddItem}
          className="text-xs text-[#c5b358] hover:text-[#8a7a20] font-medium flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {singularTitle}
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-[#fdfaf5] rounded border border-[#e5e1d8] p-3 relative"
            >
              <button
                type="button"
                aria-label={`Remove ${singularTitle}`}
                onClick={() => handleRemoveItem(index)}
                className="absolute top-2 right-2 text-[#5a5a40] hover:text-[#2c2c26]"
              >
                <X className="w-4 h-4" />
              </button>
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
