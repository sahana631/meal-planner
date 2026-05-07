import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './AddRecipeModal.css';

const EMPTY_FORM = { title: '', description: '', time: '', servings: '', ingredients: [] };

export default function AddRecipeModal({ onClose, onSave, initialRecipe }) {
  const [form, setForm] = useState(
    initialRecipe
      ? { title: initialRecipe.title, description: initialRecipe.description ?? '', time: initialRecipe.time, servings: initialRecipe.servings, ingredients: [...initialRecipe.ingredients] }
      : EMPTY_FORM
  );
  const [ingredientInput, setIngredientInput] = useState('');
  const [errors, setErrors] = useState({});

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
          <p className="modal-description">{initialRecipe ? 'Update the details below.' : "Fill in the details and we'll add it to your recipe list."}</p>
        </div>

        <hr className="modal-divider" />

        <div className="modal-body">
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
        </div>
      </div>
    </div>
  );
}
