import { ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import './RecipeCard.css';

export default function RecipeCard({ title, description, time, servings, onAddToCart, onViewRecipe, onEdit, onDelete }) {
  function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm(`Delete "${title}"? This can't be undone.`)) onDelete();
  }

  return (
    <div className="recipe-card">
      <div className="recipe-card-accent" />
      <div className="recipe-card-body">
        <div className="recipe-title-row">
          <h2 className="recipe-title">{title}</h2>
          <div className="recipe-card-actions-top">
            <button className="edit-btn" onClick={onEdit} aria-label="Edit recipe">
              <Pencil size={14} />
            </button>
            <button className="delete-btn" onClick={handleDelete} aria-label="Delete recipe">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="recipe-description">{description}</p>
        <div className="recipe-meta">
          <span className="recipe-pill">{time}</span>
          <span className="recipe-pill">{servings} servings</span>
        </div>
      </div>
      <div className="recipe-card-actions">
        <button className="view-recipe-btn" onClick={onViewRecipe}>View Recipe</button>
        <button className="add-to-cart-btn" onClick={onAddToCart}>
          <ShoppingCart size={15} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
