import { useState } from 'react';
import { Plus, X, Star, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export default function ImageManager({ value, onChange, max = 10 }: Props) {
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addUrl = () => {
    setError('');
    const url = newUrl.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('URL must start with http:// or https://');
      return;
    }
    if (value.length >= max) {
      setError(`Maximum ${max} images`);
      return;
    }
    if (value.includes(url)) {
      setError('This URL is already added');
      return;
    }
    onChange([...value, url]);
    setNewUrl('');
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const reordered = [value[index], ...value.filter((_, i) => i !== index)];
    onChange(reordered);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...value];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
    setDragIndex(null);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={newUrl}
          onChange={e => { setNewUrl(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="https://example.com/image.jpg"
          className="input-base flex-1"
        />
        <button
          type="button"
          onClick={addUrl}
          className="btn-secondary shrink-0"
          disabled={value.length >= max}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {value.length === 0 ? (
        <div className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center text-ink-500 text-sm">
          No images yet. Add URLs above.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              className={cn(
                'relative group aspect-square rounded-xl overflow-hidden border bg-ink-100',
                i === 0 ? 'border-ink-900 border-2' : 'border-ink-200',
                dragIndex === i && 'opacity-50'
              )}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/40 transition-colors" />
              <div className="absolute top-1.5 left-1.5 flex gap-1">
                <span className="w-6 h-6 grid place-items-center rounded-full bg-white text-xs font-bold text-ink-900 shadow-sm">
                  {i + 1}
                </span>
                {i === 0 && (
                  <span className="px-2 h-6 grid place-items-center rounded-full bg-ink-900 text-white text-[10px] font-bold uppercase tracking-wider">
                    <Star className="w-3 h-3 mr-0.5 fill-current" />
                    Primary
                  </span>
                )}
              </div>
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setPrimary(i)}
                  disabled={i === 0}
                  className="w-7 h-7 grid place-items-center rounded-full bg-white text-ink-900 shadow-sm hover:bg-ink-100 disabled:opacity-40"
                  aria-label="Set as primary"
                  title="Set as primary"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="w-7 h-7 grid place-items-center rounded-full bg-white text-red-600 shadow-sm hover:bg-red-50"
                  aria-label="Remove image"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <span className="w-7 h-7 grid place-items-center rounded-full bg-white text-ink-700 shadow-sm">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
          {value.length < max && (
            <div className="aspect-square rounded-xl border-2 border-dashed border-ink-200 grid place-items-center text-ink-400 text-xs">
              {value.length}/{max}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-ink-500">
        Drag to reorder. First image is the primary product image.
      </p>
    </div>
  );
}