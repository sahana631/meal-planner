import { ShoppingCart } from 'lucide-react';
import './RecipeModal.css';

export default function RecipeModal({ recipe, checked, onToggle, onToggleAll, onClose, onAddToCart }) {
  if (!recipe) return null;

  const selectedCount = recipe.ingredients.filter((_, i) => checked[i]).length;
  const allChecked = selectedCount === recipe.ingredients.length;

  function handleAddToCart() {
    const selected = recipe.ingredients.filter((_, i) => checked[i]);
    onAddToCart(recipe, selected);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{recipe.title}</h2>
          <p className="modal-description">{recipe.description}</p>
          <div className="modal-meta">
            <span className="modal-pill">{recipe.time}</span>
            <span className="modal-pill">{recipe.servings} servings</span>
          </div>
        </div>

        <hr className="modal-divider" />

        <div className="modal-body">
          <div className="ingredients-header">
            <h3>Ingredients</h3>
            <button className="select-all-btn" onClick={() => onToggleAll(!allChecked)}>
              {allChecked ? 'Uncheck All' : 'Check All'}
            </button>
          </div>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, i) => (
              <li
                key={i}
                className="ingredient-item"
                onClick={() => onToggle(i)}
              >
                <input
                  type="checkbox"
                  checked={!!checked[i]}
                  onChange={() => onToggle(i)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
          <button
            className="modal-cart-btn"
            onClick={handleAddToCart}
            disabled={selectedCount === 0}
          >
            <ShoppingCart size={16} />
            Add {selectedCount} Ingredient{selectedCount !== 1 ? 's' : ''} to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
