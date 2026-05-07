import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import './Cart.css';

export default function Cart({ cart, onRemoveIngredient, onCheckout }) {
  const totalIngredients = cart.reduce((sum, item) => sum + item.ingredients.length, 0);

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty">
          <span className="cart-empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Add ingredients from a recipe to get started</p>
          <Link to="/" className="browse-btn">Browse Recipes</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>My Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.recipeId} className="cart-recipe">
              <h2 className="cart-recipe-title">{item.recipeTitle}</h2>
              <ul className="cart-ingredients">
                {item.ingredients.map((ingredient, i) => (
                  <li key={i} className="cart-ingredient">
                    <span>{ingredient}</span>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveIngredient(item.recipeId, ingredient)}
                      aria-label="Remove ingredient"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <aside className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Recipes</span>
            <span>{cart.length}</span>
          </div>
          <div className="summary-row">
            <span>Ingredients</span>
            <span>{totalIngredients}</span>
          </div>
          <div className="summary-divider" />
          <button className="send-to-kroger-btn" onClick={onCheckout}>
        <ShoppingCart size={17} />
        Send to Kroger
      </button>
        </aside>
      </div>
    </main>
  );
}
