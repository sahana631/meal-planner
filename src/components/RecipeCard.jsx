import './RecipeCard.css';

export default function RecipeCard({ title, description, time, servings, onAddToCart, onViewRecipe }) {
  return (
    <div className="recipe-card">
      <div className="recipe-card-body">
        <h2 className="recipe-title">{title}</h2>
        <p className="recipe-description">{description}</p>
        <div className="recipe-meta">
          <span>{time}</span>
          <span>{servings} servings</span>
        </div>
      </div>
      <div className="recipe-card-actions">
        <button className="view-recipe-btn" onClick={onViewRecipe}>
          View Recipe
        </button>
        <button className="add-to-cart-btn" onClick={onAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
