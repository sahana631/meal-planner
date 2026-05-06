import './Cart.css';

export default function Cart({ cart, onRemoveIngredient }) {
  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <h1>My Cart</h1>
        <p className="cart-empty">No ingredients yet — add some from a recipe!</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>My Cart</h1>
      <div className="cart-list">
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
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
