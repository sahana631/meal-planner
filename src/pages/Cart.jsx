import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { connectKroger, searchKroger, searchKrogerLocations, sendToKroger } from '../services/api';
import KrogerModal from '../components/KrogerModal';
import './Cart.css';

// --- Consolidation helpers ---

function parseFraction(str) {
  str = str.trim();
  const parts = str.split(' ');
  if (parts.length === 2 && parts[1].includes('/')) {
    const [n, d] = parts[1].split('/');
    return parseInt(parts[0]) + parseInt(n) / parseInt(d);
  }
  if (str.includes('/')) {
    const [n, d] = str.split('/');
    return parseInt(n) / parseInt(d);
  }
  return parseFloat(str);
}

function normalizeUnit(u) {
  u = u.toLowerCase();
  if (/^cups?$/.test(u)) return 'cup';
  if (/^tbsps?$|^tablespoons?$/.test(u)) return 'tbsp';
  if (/^tsps?$|^teaspoons?$/.test(u)) return 'tsp';
  if (/^oz$|^ounces?$/.test(u)) return 'oz';
  if (/^lbs?$|^pounds?$/.test(u)) return 'lb';
  if (/^g$|^grams?$/.test(u)) return 'g';
  if (/^kg$/.test(u)) return 'kg';
  if (/^cloves?$/.test(u)) return 'clove';
  if (/^cans?$/.test(u)) return 'can';
  if (/^pieces?$/.test(u)) return 'piece';
  if (/^slices?$/.test(u)) return 'slice';
  if (/^stalks?$/.test(u)) return 'stalk';
  if (/^heads?$/.test(u)) return 'head';
  return u;
}

const UNIT_RE = /^(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g\b|grams?|kg\b|cloves?|cans?|pieces?|slices?|stalks?|heads?|pinch(?:es)?)/i;
const QTY_RE = /^((?:\d+\s+)?\d+(?:\/\d+|\.\d+)?)\s*/;

function parseIngredient(str) {
  let s = str.trim();
  let quantity = null;
  let unit = null;

  const qm = s.match(QTY_RE);
  if (qm) {
    quantity = parseFraction(qm[1]);
    s = s.slice(qm[0].length);
  }

  const um = s.match(UNIT_RE);
  if (um) {
    unit = normalizeUnit(um[1]);
    s = s.slice(um[0].length).trim();
  }

  const name = s.replace(/,.*$/, '').trim().toLowerCase();
  return { quantity, unit, name: name || str.toLowerCase(), original: str };
}

function formatQty(n) {
  if (Number.isInteger(n)) return String(n);
  const frac = n % 1;
  const whole = Math.floor(n);
  const fracs = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
  const f = fracs[Math.round(frac * 100) / 100];
  if (f) return whole > 0 ? `${whole} ${f}` : f;
  return n.toFixed(1);
}

function consolidate(cart) {
  const groups = new Map();

  for (const item of cart) {
    for (const ing of item.ingredients) {
      const parsed = parseIngredient(ing);
      const key = parsed.name;
      if (!groups.has(key)) groups.set(key, { name: parsed.name, entries: [] });
      groups.get(key).entries.push({ ...parsed, recipeTitle: item.recipeTitle });
    }
  }

  return Array.from(groups.values())
    .map((g) => {
      const { entries } = g;
      const units = [...new Set(entries.map((e) => e.unit))];
      const allParsed = entries.every((e) => e.quantity !== null);

      if (entries.length > 1 && units.length === 1 && units[0] !== null && allParsed) {
        const total = entries.reduce((s, e) => s + e.quantity, 0);
        const unit = units[0];
        const plural = total !== 1 && !unit.endsWith('e') ? 's' : '';
        return { ...g, total: `${formatQty(total)} ${unit}${plural}`, combined: true };
      }
      return { ...g, total: null, combined: false };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const CHAIN_LABELS = {
  KROGER: 'Kroger',
  FRED: 'Fred Meyer',
  QFC: 'QFC',
  RALPHS: 'Ralphs',
  KINGSOOPERS: 'King Soopers',
  SMITHS: "Smith's",
  FRYS: "Fry's",
  HARRISTEETER: 'Harris Teeter',
  MARIANOS: "Mariano's",
  CITYMARKET: 'City Market',
  DILLONS: 'Dillons',
  PICKNSAVE: "Pick 'n Save",
  METRO: 'Metro Market',
  BAKERS: "Baker's",
  GERBES: 'Gerbes',
};

// --- Component ---

export default function Cart({ cart, user, pantry, onRemoveIngredient, onCheckout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [banner, setBanner] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [krogerResults, setKrogerResults] = useState(null);
  const [view, setView] = useState('recipe'); // 'recipe' | 'list'
  const [checked, setChecked] = useState({});

  const [krogerStore, setKrogerStore] = useState(() => {
    try { return JSON.parse(localStorage.getItem('krogerStore')) || null; } catch { return null; }
  });
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [storeZip, setStoreZip] = useState('');
  const [storeChain, setStoreChain] = useState('KROGER');
  const [storeResults, setStoreResults] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    const kroger = searchParams.get('kroger');
    if (kroger === 'connected') {
      setBanner({ type: 'success', message: `${storeBrand} account connected!` });
      setSearchParams({}, { replace: true });
    } else if (kroger === 'error') {
      setBanner({ type: 'error', message: `Failed to connect ${storeBrand}. Please try again.` });
      setSearchParams({}, { replace: true });
    }
  }, []);

  async function handleLookupStores(e) {
    e.preventDefault();
    if (!storeZip.trim()) return;
    setLoadingStores(true);
    setStoreResults([]);
    try {
      const { locations } = await searchKrogerLocations({ zip: storeZip.trim() }, storeChain);
      setStoreResults(locations);
    } catch {
      setStoreResults([]);
    } finally {
      setLoadingStores(false);
    }
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLoadingStores(true);
    setStoreResults([]);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { locations } = await searchKrogerLocations({ lat: coords.latitude, lng: coords.longitude }, storeChain);
          setStoreResults(locations);
        } catch {
          setStoreResults([]);
        } finally {
          setLoadingStores(false);
        }
      },
      () => setLoadingStores(false),
    );
  }

  function handleSelectStore(store) {
    const storeWithChain = { ...store, chain: storeChain };
    setKrogerStore(storeWithChain);
    localStorage.setItem('krogerStore', JSON.stringify(storeWithChain));
    setShowStoreSelector(false);
    setStoreResults([]);
    setStoreZip('');
  }

  async function handleSearchKroger() {
    setSearching(true);
    setBanner(null);
    try {
      const ingredients = consolidated
        .filter((g) => !pantryNames.has(g.name))
        .map((g) => g.entries[0].original);
      const { results } = await searchKroger(ingredients, krogerStore?.locationId || null);
      setKrogerResults(results);
    } catch (err) {
      setBanner({ type: 'error', message: err.message || `Failed to search ${storeBrand} products` });
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

  const storeBrand = krogerStore?.chain ? (CHAIN_LABELS[krogerStore.chain] || 'Kroger') : 'Kroger';
  const totalIngredients = cart.reduce((sum, item) => sum + item.ingredients.length, 0);
  const consolidated = consolidate(cart);
  const pantryNames = new Set((pantry || []).map((p) => p.name));
  const pantryMap = Object.fromEntries((pantry || []).map((p) => [p.name, p.id]));
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const inPantryCount = consolidated.filter((g) => pantryNames.has(g.name)).length;

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        {banner && <div className={`cart-banner cart-banner-${banner.type}`}>{banner.message}</div>}
        <div className="cart-empty">
          <span className="cart-empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Add ingredients from a recipe to get started</p>
          <Link to="/recipes" className="browse-btn">Browse Recipes</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      {banner && <div className={`cart-banner cart-banner-${banner.type}`}>{banner.message}</div>}
      <div className="cart-header">
        <h1>My Cart</h1>
        <div className="view-toggle">
          <button className={`view-toggle-btn ${view === 'recipe' ? 'active' : ''}`} onClick={() => setView('recipe')}>
            By Recipe
          </button>
          <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            Shopping List
          </button>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {view === 'recipe' ? (
            cart.map((item) => (
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
            ))
          ) : (
            <div className="shopping-list">
              <p className="shopping-list-hint">
                {inPantryCount > 0
                  ? `${inPantryCount} item${inPantryCount !== 1 ? 's' : ''} in pantry · ${consolidated.length - inPantryCount} to buy`
                  : `${consolidated.length} unique ingredients across ${cart.length} recipe${cart.length !== 1 ? 's' : ''}`}
              </p>
              <ul className="shopping-list-items">
                {consolidated.map((group) => {
                  const inPantry = pantryNames.has(group.name);
                  return (
                    <li
                      key={group.name}
                      className={`shopping-list-item ${checked[group.name] ? 'checked' : ''} ${inPantry ? 'in-pantry' : ''}`}
                      onClick={() => !inPantry && setChecked((prev) => ({ ...prev, [group.name]: !prev[group.name] }))}
                    >
                      <input
                        type="checkbox"
                        checked={!!checked[group.name]}
                        disabled={inPantry}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="shopping-list-item-body">
                        <div className="shopping-list-item-top">
                          <span className="shopping-list-name">
                            {group.name.charAt(0).toUpperCase() + group.name.slice(1)}
                          </span>
                          <div className="shopping-list-item-badges">
                            {inPantry
                              ? <span className="in-pantry-label">In pantry</span>
                              : group.combined && <span className="shopping-list-total">{group.total} total</span>
                            }
                          </div>
                        </div>
                        {!inPantry && (
                          <div className="shopping-list-sources">
                            {group.entries.map((e, i) => (
                              <span key={i} className="shopping-list-source">
                                {e.original} · {e.recipeTitle}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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
          {view === 'list' && (
            <>
              {consolidated.some((g) => g.combined) && (
                <div className="summary-row summary-row-highlight">
                  <span>Unique items</span>
                  <span>{consolidated.length}</span>
                </div>
              )}
              {inPantryCount > 0 && (
                <div className="summary-row">
                  <span>In pantry</span>
                  <span>{inPantryCount} skipped</span>
                </div>
              )}
            </>
          )}
          <div className="summary-divider" />

          {user?.krogerConnected && (
            <div className="kroger-store-row">
              {krogerStore ? (
                <span className="kroger-store-name" title={krogerStore.address}>
                  📍 {krogerStore.name}
                </span>
              ) : (
                <span className="kroger-store-missing">No store set — results may include out-of-stock items</span>
              )}
              <button className="kroger-store-change-btn" onClick={() => setShowStoreSelector((v) => !v)}>
                {krogerStore ? 'Change' : 'Set store'}
              </button>
            </div>
          )}

          {showStoreSelector && (
            <div className="kroger-store-selector">
              <form className="kroger-store-form" onSubmit={handleLookupStores}>
                <select
                  className="kroger-store-chain-select"
                  value={storeChain}
                  onChange={(e) => { setStoreChain(e.target.value); setStoreResults([]); }}
                >
                  <option value="KROGER">Kroger</option>
                  <option value="FRED">Fred Meyer</option>
                  <option value="QFC">QFC</option>
                  <option value="RALPHS">Ralphs</option>
                  <option value="KINGSOOPERS">King Soopers</option>
                  <option value="SMITHS">Smith's</option>
                  <option value="FRYS">Fry's</option>
                  <option value="HARRISTEETER">Harris Teeter</option>
                  <option value="MARIANOS">Mariano's</option>
                  <option value="CITYMARKET">City Market</option>
                  <option value="DILLONS">Dillons</option>
                  <option value="PICKNSAVE">Pick 'n Save</option>
                  <option value="METRO">Metro Market</option>
                  <option value="BAKERS">Baker's</option>
                  <option value="GERBES">Gerbes</option>
                </select>
                <input
                  className="kroger-store-zip-input"
                  type="text"
                  placeholder="Zip code"
                  value={storeZip}
                  onChange={(e) => setStoreZip(e.target.value)}
                  maxLength={10}
                />
                <button className="kroger-store-search-btn" type="submit" disabled={loadingStores}>
                  {loadingStores ? '...' : 'Find'}
                </button>
              </form>
              <button
                className="kroger-use-location-btn"
                type="button"
                onClick={handleUseMyLocation}
                disabled={loadingStores}
              >
                📍 Use my location
              </button>
              {storeResults.length > 0 && (
                <ul className="kroger-store-list">
                  {storeResults.map((s) => (
                    <li key={s.locationId} className="kroger-store-option" onClick={() => handleSelectStore(s)}>
                      <span className="kroger-store-option-name">{s.name}</span>
                      <span className="kroger-store-option-addr">{s.address}</span>
                    </li>
                  ))}
                </ul>
              )}
              {storeResults.length === 0 && !loadingStores && storeZip && (
                <p className="kroger-store-none">No stores found. Try a different zip code.</p>
              )}
            </div>
          )}

          {user?.krogerConnected ? (
            <button className="send-to-kroger-btn" onClick={handleSearchKroger} disabled={searching}>
              <ShoppingCart size={17} />
              {searching ? 'Finding products...' : `Send to ${storeBrand}`}
            </button>
          ) : (
            <button className="send-to-kroger-btn connect-kroger-btn" onClick={connectKroger}>
              <ShoppingCart size={17} />
              Connect {storeBrand}
            </button>
          )}
          <button
            className="clear-cart-btn"
            onClick={() => { if (window.confirm('Clear your entire cart?')) onCheckout(); }}
          >
            Clear Cart
          </button>
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
