import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { connectKroger, searchKroger, sendToKroger } from '../services/api';
import KrogerModal from '../components/KrogerModal';
import './Cart.css';

export default function Cart({ cart, user, onRemoveIngredient, onCheckout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [banner, setBanner] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [krogerResults, setKrogerResults] = useState(null);

  useEffect(() => {
    const kroger = searchParams.get('kroger');
    if (kroger === 'connected') {
      setBanner({ type: 'success', message: 'Kroger account connected!' });
      setSearchParams({}, { replace: true });
    } else if (kroger === 'error') {
      setBanner({ type: 'error', message: 'Failed to connect Kroger. Please try again.' });
      setSearchParams({}, { replace: true });
    }
  }, []);

  async function handleSearchKroger() {
    setSearching(true);
    setBanner(null);
    try {
      const ingredients = cart.flatMap((item) => item.ingredients);
      const { results } = await searchKroger(ingredients);
      setKrogerResults(results);
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Failed to search Kroger products' });
    } finally {
      setSearching(false);
    }
  }

  async function handleConfirm(items) {
    setSending(true);
    try {
      const result = await sendToKroger(items);
      await onCheckout();
      setKrogerResults(null);
      setBanner({ type: 'success', message: `${result.added} item${result.added !== 1 ? 's' : ''} sent to your Kroger cart!` });
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Failed to send to Kroger' });
    } finally {
      setSending(false);
    }
  }

  const totalIngredients = cart.reduce((sum, item) => sum + item.ingredients.length, 0);

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        {banner && <div className={`cart-banner cart-banner-${banner.type}`}>{banner.message}</div>}
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
      {banner && <div className={`cart-banner cart-banner-${banner.type}`}>{banner.message}</div>}
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
                      onClick={() => onRemoveIngredient(item.id, ingredient)}
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

          {user?.krogerConnected ? (
            <button className="send-to-kroger-btn" onClick={handleSearchKroger} disabled={searching}>
              <ShoppingCart size={17} />
              {searching ? 'Finding products...' : 'Send to Kroger'}
            </button>
          ) : (
            <button className="send-to-kroger-btn connect-kroger-btn" onClick={connectKroger}>
              <ShoppingCart size={17} />
              Connect Kroger
            </button>
          )}
        </aside>
      </div>

      {krogerResults && (
        <KrogerModal
          results={krogerResults}
          onConfirm={handleConfirm}
          onClose={() => setKrogerResults(null)}
          sending={sending}
        />
      )}
    </main>
  );
}
