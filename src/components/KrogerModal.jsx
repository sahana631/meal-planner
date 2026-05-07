import { useState } from 'react';
import { X, Check } from 'lucide-react';
import './KrogerModal.css';

function cleanIngredient(ingredient) {
  return ingredient
    .replace(/^\d+(\s*\d+\/\d+|\.\d+|\/\d+)?\s*/i, '')
    .replace(/^(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|kg|ml|liters?|litres?|pinch(es)?|dash(es)?|cloves?|cans?|bunches?|heads?|slices?|pieces?|stalks?|sprigs?|packets?|fillets?)\s+/i, '')
    .replace(/,.*$/, '')
    .trim();
}

export default function KrogerModal({ results, onConfirm, onClose, sending }) {
  const [selected, setSelected] = useState(() => {
    const init = {};
    results.forEach(({ ingredient, products }) => {
      if (products.length > 0) init[ingredient] = products[0].upc;
    });
    return init;
  });

  function toggle(ingredient, upc) {
    setSelected((prev) => ({
      ...prev,
      [ingredient]: prev[ingredient] === upc ? null : upc,
    }));
  }

  function handleConfirm() {
    const items = Object.values(selected)
      .filter(Boolean)
      .map((upc) => ({ upc, quantity: 1, modality: 'PICKUP' }));
    onConfirm(items);
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="kroger-overlay" onClick={onClose}>
      <div className="kroger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kroger-modal-header">
          <div>
            <h2>Choose Your Products</h2>
            <p className="kroger-modal-sub">First result is pre-selected — swap or deselect as needed.</p>
          </div>
          <button className="kroger-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="kroger-modal-body">
          {results.map(({ ingredient, products }) => (
            <div key={ingredient} className="kroger-section">
              <div className="kroger-ingredient-label">{cleanIngredient(ingredient)}</div>
              {products.length === 0 ? (
                <p className="kroger-no-results">No products found</p>
              ) : (
                <div className="kroger-products">
                  {products.map((product) => {
                    const isSelected = selected[ingredient] === product.upc;
                    return (
                      <button
                        key={product.upc}
                        className={`kroger-product-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggle(ingredient, product.upc)}
                      >
                        {isSelected && <span className="kroger-check"><Check size={13} /></span>}
                        {product.image
                          ? <img src={product.image} alt={product.name} className="kroger-product-img" />
                          : <div className="kroger-product-img-placeholder" />
                        }
                        <div className="kroger-product-name">{product.name}</div>
                        {product.price != null && (
                          <div className="kroger-product-price">${product.price.toFixed(2)}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="kroger-modal-footer">
          <button className="kroger-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="kroger-confirm-btn"
            onClick={handleConfirm}
            disabled={selectedCount === 0 || sending}
          >
            {sending ? 'Sending...' : `Add ${selectedCount} item${selectedCount !== 1 ? 's' : ''} to Kroger`}
          </button>
        </div>
      </div>
    </div>
  );
}
