import { useState, useEffect } from 'react';
import { ShoppingCart, Refrigerator } from 'lucide-react';
import { isInPantry } from '../utils/pantryMatch';
import './RecipeModal.css';

const MODIFIERS = /\s*(to taste|as needed|as required|for seasoning|freshly ground|optional)\s*/gi;

const FRACTIONS = [
  [1/8, '1/8'], [1/4, '1/4'], [1/3, '1/3'], [3/8, '3/8'],
  [1/2, '1/2'], [5/8, '5/8'], [2/3, '2/3'], [3/4, '3/4'], [7/8, '7/8'],
];

function formatQuantity(n) {
  if (n <= 0) return '0';
  const whole = Math.floor(n);
  const frac = n - whole;
  if (frac < 0.05) return String(whole);
  if (frac > 0.95) return String(whole + 1);
  let closest = FRACTIONS[0];
  let minDiff = Infinity;
  for (const [val, str] of FRACTIONS) {
    const diff = Math.abs(frac - val);
    if (diff < minDiff) { minDiff = diff; closest = [val, str]; }
  }
  return whole === 0 ? closest[1] : `${whole} ${closest[1]}`;
}

function scaleIngredient(ing, factor) {
  if (factor === 1) return ing;
  const match = ing.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)(.*)/);
  if (!match) return ing;
  const numStr = match[1].trim();
  const rest = match[2];
  let value;
  if (numStr.includes('/')) {
    const spaceIdx = numStr.indexOf(' ');
    if (spaceIdx !== -1) {
      const whole = parseInt(numStr.slice(0, spaceIdx));
      const [num, den] = numStr.slice(spaceIdx + 1).split('/');
      value = whole + parseInt(num) / parseInt(den);
    } else {
      const [num, den] = numStr.split('/');
      value = parseInt(num) / parseInt(den);
    }
  } else {
    value = parseFloat(numStr);
  }
  return `${formatQuantity(value * factor)}${rest}`;
}

function expandIngredient(ing) {
  const parts = ing.split(/\s+and\s+/i)
    .map((p) => p.replace(MODIFIERS, '').trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [ing];
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function RecipeModal({ recipe, pantry = [], onAddToCart, onAddToPantry, onClose }) {
  const [destinations, setDestinations] = useState({});
  const [servings, setServings] = useState(1);
  const [tab, setTab] = useState('ingredients');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    if (!recipe) return;
    const names = new Set((pantry || []).map((p) => p.name));
    const initial = {};
    recipe.ingredients.forEach((ing, i) => {
      initial[i] = isInPantry(ing, names) ? 'pantry' : 'cart';
    });
    setDestinations(initial);
    setServings(recipe.servings);
    setTab('ingredients');
  }, [recipe?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!recipe) return null;

  const pantryNames = new Set((pantry || []).map((p) => p.name));
  const scaleFactor = servings / recipe.servings;
  const tags = recipe.tags || [];
  const instructions = recipe.instructions || '';

  function toggle(i, dest) {
    setDestinations((prev) => ({ ...prev, [i]: prev[i] === dest ? null : dest }));
  }

  async function handleConfirm() {
    setConfirming(true);
    setConfirmError('');
    try {
      const cartItems = [];
      const pantryItems = [];
      recipe.ingredients.forEach((ing, i) => {
        const parts = expandIngredient(scaleIngredient(ing, scaleFactor));
        if (destinations[i] === 'cart') cartItems.push(...parts);
        else if (destinations[i] === 'pantry') pantryItems.push(...parts);
      });
      const tasks = [];
      if (cartItems.length > 0) tasks.push(onAddToCart(recipe, cartItems));
      if (pantryItems.length > 0 && onAddToPantry) {
        tasks.push(Promise.all(pantryItems.map((name) => onAddToPantry(name))));
      }
      await Promise.all(tasks);
      onClose();
    } catch (e) {
      setConfirmError('Something went wrong. Please try again.');
      setConfirming(false);
    }
  }

  const cartCount = Object.values(destinations).filter((d) => d === 'cart').length;
  const pantryCount = Object.values(destinations).filter((d) => d === 'pantry').length;
  const anySelected = cartCount > 0 || pantryCount > 0;

  const summaryParts = [];
  if (cartCount > 0) summaryParts.push(`${cartCount} to cart`);
  if (pantryCount > 0) summaryParts.push(`${pantryCount} to pantry`);

  const instructionLines = instructions.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{recipe.title}</h2>
          <p className="modal-description">{recipe.description}</p>
          {tags.length > 0 && (
            <div className="recipe-tags">
              {tags.map((tag) => <span key={tag} className="recipe-tag">{tag}</span>)}
            </div>
          )}
          <div className="modal-meta">
            <span className="modal-pill">{recipe.time}</span>
            <div className="servings-adjuster">
              <button
                className="servings-adj-btn"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                disabled={servings <= 1}
              >−</button>
              <span>{servings} serving{servings !== 1 ? 's' : ''}</span>
              <button
                className="servings-adj-btn"
                onClick={() => setServings((s) => s + 1)}
              >+</button>
            </div>
          </div>
        </div>

        <hr className="modal-divider" />

        {instructions && (
          <div className="modal-tabs">
            <button
              className={`modal-tab ${tab === 'ingredients' ? 'modal-tab--active' : ''}`}
              onClick={() => setTab('ingredients')}
            >Ingredients</button>
            <button
              className={`modal-tab ${tab === 'instructions' ? 'modal-tab--active' : ''}`}
              onClick={() => setTab('instructions')}
            >Instructions</button>
          </div>
        )}

        <div className="modal-body">
          {tab === 'ingredients' && (
            <>
              <div className="ingredients-header">
                <h3>Ingredients</h3>
                <div className="ing-dest-legend">
                  <ShoppingCart size={12} /><span>Cart</span>
                  <Refrigerator size={12} /><span>Pantry</span>
                </div>
              </div>

              <ul className="ingredients-list">
                {recipe.ingredients.map((ingredient, i) => {
                  const inPantry = pantryNames.size > 0 && isInPantry(ingredient, pantryNames);
                  const dest = destinations[i];
                  const display = cap(scaleIngredient(ingredient, scaleFactor));
                  return (
                    <li key={i} className="ingredient-item ingredient-dest-row">
                      <span className="ingredient-text">{display}</span>
                      {inPantry && <span className="ingredient-pantry-badge">In pantry</span>}
                      <div className="dest-toggles">
                        <button
                          className={`dest-btn ${dest === 'cart' ? 'dest-btn--active' : ''}`}
                          onClick={() => toggle(i, 'cart')}
                          title="Add to cart"
                        >
                          <ShoppingCart size={13} />
                        </button>
                        <button
                          className={`dest-btn ${dest === 'pantry' ? 'dest-btn--active' : ''}`}
                          onClick={() => toggle(i, 'pantry')}
                          title="Add to pantry"
                        >
                          <Refrigerator size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {summaryParts.length > 0 && (
                <p className="modal-confirm-summary">{summaryParts.join(' · ')}</p>
              )}

              {confirmError && <p className="modal-confirm-error">{confirmError}</p>}

              <button className="modal-cart-btn" onClick={handleConfirm} disabled={!anySelected || confirming}>
                {confirming ? 'Adding...' : 'Confirm'}
              </button>
            </>
          )}

          {tab === 'instructions' && (
            <ol className="instructions-list">
              {instructionLines.map((line, i) => {
                const clean = line.replace(/^\d+\.\s*/, '');
                return <li key={i} className="instruction-step">{clean}</li>;
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
