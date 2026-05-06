import { useState, useEffect } from 'react';
import './RecipeModal.css';

export default function RecipeModal({ recipe, onClose, onAddToCart }) {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (recipe) {
      const initial = {};
      recipe.ingredients.forEach((_, i) => { initial[i] = false; });
      setChecked(initial);
    }
  }, [recipe]);

  if (!recipe) return null;

  function toggleIngredient(i) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  const selectedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = selectedCount === recipe.ingredients.length;

  function toggleAll() {
    const next = !allChecked;
    const updated = {};
    recipe.ingredients.forEach((_, i) => { updated[i] = next; });
    setChecked(updated);
  }

  function handleAddToCart() {
    const selected = recipe.ingredients.filter((_, i) => checked[i]);
    onAddToCart(recipe, selected);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{recipe.title}</h2>
        <p className="modal-description">{recipe.description}</p>
        <div className="modal-meta">
          <span>{recipe.time}</span>
          <span>{recipe.servings} servings</span>
        </div>
        <div className="ingredients-header">
          <h3>Ingredients</h3>
          <button className="select-all-btn" onClick={toggleAll}>
            {allChecked ? 'Uncheck All' : 'Check All'}
          </button>
        </div>
        <ul className="ingredients-list">
          {recipe.ingredients.map((ingredient, i) => (
            <li
              key={i}
              className={`ingredient-item ${!checked[i] ? 'unchecked' : ''}`}
              onClick={() => toggleIngredient(i)}
            >
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => toggleIngredient(i)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
        <button
          className="add-to-cart-btn modal-cart-btn"
          onClick={handleAddToCart}
          disabled={selectedCount === 0}
        >
          Add {selectedCount} Ingredient{selectedCount !== 1 ? 's' : ''} to Cart
        </button>
      </div>
    </div>
  );
}
