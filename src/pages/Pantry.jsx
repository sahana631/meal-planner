import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './Pantry.css';

export default function Pantry({ pantry, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  async function handleAdd() {
    const val = input.trim();
    if (!val) return;
    setError('');
    try {
      await onAdd(val.toLowerCase());
      setInput('');
    } catch (e) {
      setError(e.message || 'Failed to add item');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  const sorted = [...pantry].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="pantry-page">
      <div className="pantry-header">
        <h1>My Pantry</h1>
        <p className="pantry-subtitle">Items here are automatically skipped when sending to Kroger.</p>
      </div>

      {error && <p className="pantry-error">{error}</p>}
      <div className="pantry-add-row">
        <input
          className="form-input pantry-input"
          placeholder="e.g. olive oil, garlic, salt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="pantry-add-btn" onClick={handleAdd} disabled={!input.trim()}>
          <Plus size={16} /> Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="pantry-empty">
          <p>Nothing in your pantry yet.</p>
          <p>Add ingredients you always have on hand — they'll be skipped in your shopping list.</p>
        </div>
      ) : (
        <ul className="pantry-list">
          {sorted.map((item) => (
            <li key={item.id} className="pantry-item">
              <span className="pantry-item-name">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
              <button className="pantry-remove-btn" onClick={() => onRemove(item.id)}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
