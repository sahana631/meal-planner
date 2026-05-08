import { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { parseRecipe } from '../services/api';
import './AddRecipeModal.css';

const EMPTY_FORM = { title: '', description: '', time: '', servings: '', ingredients: [] };

export default function AddRecipeModal({ onClose, onSave, initialRecipe }) {
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(
    initialRecipe
      ? { title: initialRecipe.title, description: initialRecipe.description ?? '', time: initialRecipe.time, servings: initialRecipe.servings, ingredients: [...initialRecipe.ingredients] }
      : EMPTY_FORM
  );
  const [ingredientInput, setIngredientInput] = useState('');
  const [errors, setErrors] = useState({});
  const [pasteText, setPasteText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function addIngredient() {
    const val = ingredientInput.trim();
    if (!val) return;
    setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, val] }));
    setIngredientInput('');
  }

  function removeIngredient(index) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }

  function handleIngredientKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  }

  async function handleParse() {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const result = await parseRecipe(pasteText);
      setForm({
        title: result.title || '',
        description: result.description || '',
        time: result.time || '',
        servings: result.servings || '',
        ingredients: result.ingredients || [],
      });
      setMode('manual');
    } catch (e) {
      setParseError(e.message || 'Failed to parse recipe. Try again or add manually.');
    } finally {
      setParsing(false);
    }
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Recipe name is required';
    if (!form.time.trim()) errs.time = 'Cook time is required';
    if (!form.servings || form.servings < 1) errs.servings = 'Servings is required';
    if (form.ingredients.length === 0) errs.ingredients = 'Add at least one ingredient';
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      ...(initialRecipe ? { id: initialRecipe.id } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      time: form.time.trim(),
      servings: Number(form.servings),
      ingredients: form.ingredients,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-recipe-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{initialRecipe ? 'Edit Recipe' : 'Add Your Recipe'}</h2>
          <p className="modal-description">
            {initialRecipe ? 'Update the details below.' : "Fill in the details or paste a recipe and let AI parse it."}
          </p>
        </div>

        <hr className="modal-divider" />

        <div className="modal-body">
          {!initialRecipe && (
            <div className="ai-toggle-row">
              <button
                className={`ai-toggle-btn ${mode === 'manual' ? 'active' : ''}`}
                onClick={() => setMode('manual')}
              >
                Manual
              </button>
              <button
                className={`ai-toggle-btn ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
              >
                <Sparkles size={13} />
                Import with AI
              </button>
            </div>
          )}

          {mode === 'ai' ? (
            <div className="ai-import-section">
              <p className="ai-import-hint">Paste a recipe — from a website, a screenshot description, or just describe it in your own words.</p>
              <textarea
                className="form-input form-textarea ai-paste-area"
                placeholder={`e.g. Spaghetti Bolognese — cook 400g ground beef with onion, garlic, crushed tomatoes, and Italian seasoning. Serve over 300g spaghetti. Takes about 40 minutes, serves 4.`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={7}
              />
              {parseError && <span className="error-msg">{parseError}</span>}
              <button
                className="modal-cart-btn save-recipe-btn"
                onClick={handleParse}
                disabled={parsing || !pasteText.trim()}
              >
                {parsing ? 'Parsing...' : <><Sparkles size={15} /> Parse Recipe</>}
              </button>
            </div>
          ) : (
            <>
              <div className="form-row">
                <label>Recipe Name *</label>
                <input
                  className={`form-input ${errors.title ? 'input-error' : ''}`}
                  name="title"
                  placeholder="e.g. Spicy Tofu Stir Fry"
                  value={form.title}
                  onChange={handleChange}
                />
                {errors.title && <span className="error-msg">{errors.title}</span>}
              </div>

              <div className="form-row">
                <label>Description</label>
                <textarea
                  className="form-input form-textarea"
                  name="description"
                  placeholder="A short description of the dish..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row-split">
                <div className="form-row">
                  <label>Cook Time *</label>
                  <input
                    className={`form-input ${errors.time ? 'input-error' : ''}`}
                    name="time"
                    placeholder="e.g. 30 min"
                    value={form.time}
                    onChange={handleChange}
                  />
                  {errors.time && <span className="error-msg">{errors.time}</span>}
                </div>
                <div className="form-row">
                  <label>Servings *</label>
                  <input
                    className={`form-input ${errors.servings ? 'input-error' : ''}`}
                    name="servings"
                    type="number"
                    min="1"
                    placeholder="e.g. 4"
                    value={form.servings}
                    onChange={handleChange}
                  />
                  {errors.servings && <span className="error-msg">{errors.servings}</span>}
                </div>
              </div>

              <div className="form-row">
                <label>Ingredients *</label>
                <div className="ingredient-input-row">
                  <input
                    className="form-input"
                    placeholder="e.g. 2 cups jasmine rice"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={handleIngredientKeyDown}
                  />
                  <button type="button" className="add-ingredient-btn" onClick={addIngredient}>
                    <Plus size={16} />
                  </button>
                </div>
                {errors.ingredients && <span className="error-msg">{errors.ingredients}</span>}
                {form.ingredients.length > 0 && (
                  <ul className="added-ingredients">
                    {form.ingredients.map((ing, i) => (
                      <li key={i} className="added-ingredient">
                        <span>{ing}</span>
                        <button className="remove-ingredient-btn" onClick={() => removeIngredient(i)}>
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button className="modal-cart-btn save-recipe-btn" onClick={handleSave}>
                {initialRecipe ? 'Save Changes' : 'Save Recipe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
