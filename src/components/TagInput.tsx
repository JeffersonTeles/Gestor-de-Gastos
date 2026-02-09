import { Plus, Tag, X } from 'lucide-react';
import React, { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const TAG_COLORS = [
  'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',
  'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
  'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400',
  'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400',
];

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, maxTags = 5 }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    setError(null);

    if (!trimmed) {
      setError('Tag não pode ser vazia');
      return;
    }

    if (trimmed.length > 20) {
      setError('Tag muito longa (máximo 20 caracteres)');
      return;
    }

    if (tags.includes(trimmed)) {
      setError('Esta tag já existe');
      return;
    }

    if (tags.length >= maxTags) {
      setError(`Máximo de ${maxTags} tags permitidas`);
      return;
    }

    // Validar caracteres (apenas letras, números, espaços e hífens)
    if (!/^[a-z0-9\s\-]+$/.test(trimmed)) {
      setError('Use apenas letras, números, espaços e hífens');
      return;
    }

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const getTagColor = (index: number) => {
    return TAG_COLORS[index % TAG_COLORS.length];
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
        <Tag size={16} />
        Tags
        <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
          (opcional, máx. {maxTags})
        </span>
      </label>

      {/* Tags existentes */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={tag}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${getTagColor(
                index
              )} transition-all hover:scale-105`}
            >
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-70 transition-opacity"
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input para nova tag */}
      {tags.length < maxTags && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="adicionar tag..."
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800 dark:text-zinc-100"
              maxLength={20}
            />
            <button
              onClick={handleAddTag}
              type="button"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500 dark:text-zinc-400">
        💡 Use tags para organizar e filtrar transações (ex: #urgente, #trabalho, #viagem)
      </div>
    </div>
  );
};

export default TagInput;
