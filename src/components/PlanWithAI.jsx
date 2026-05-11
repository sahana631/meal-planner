import { useState } from 'react';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { planMeals } from '../services/api';
import './PlanWithAI.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PlanWithAI({ recipes, pantry = [], onAddToPlan, onClose }) {
  const [step, setStep] = useState('input');
  const [description, setDescription] = useState('');
  const [matchedRecipes, setMatchedRecipes] = useState([]);
  const [suggestedDayIdx, setSuggestedDayIdx] = useState(null);
  const [error, setError] = useState('');
  const [schedulingRecipe, setSchedulingRecipe] = useState(null);
  const [scheduleDay, setScheduleDay] = useState(0);
  const [scheduleMeal, setScheduleMeal] = useState('Breakfast');
  const [scheduling, setScheduling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getMonday(new Date());
  // For each day Mon–Sun: if the day has already passed this week, show next week's date instead
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return d < today ? addDays(d, 7) : d;
  });
  const hasRecipes = recipes && recipes.length > 0;

  async function handleGenerate() {
    if (!description.trim() || !hasRecipes) return;
    setStep('loading');
    setError('');
    setSuccessMsg('');
    try {
      const slim = recipes.map((r) => ({ id: r.id, title: r.title, description: r.description, tags: r.tags || [], ingredients: r.ingredients || [] }));
      const pantryItems = pantry.map((p) => p.name);
      const result = await planMeals(description, slim, pantryItems);
      const matches = (result.recipeIds || []).map((id) => recipes.find((r) => r.id === id)).filter(Boolean);
      setMatchedRecipes(matches);
      const dayIdx = result.suggestedDay ? DAY_NAMES.indexOf(result.suggestedDay.toLowerCase()) : -1;
      setSuggestedDayIdx(dayIdx >= 0 ? dayIdx : null);
      setStep('review');
    } catch (e) {
      setError(e.message || 'Failed to find matching recipes. Try again.');
      setStep('input');
    }
  }

  function handleSelectRecipe(recipe) {
    setSchedulingRecipe(recipe);
    setScheduleDay(suggestedDayIdx ?? 0);
    setScheduleMeal('Breakfast');
    setStep('schedule');
  }

  async function handleAddToPlan() {
    setScheduling(true);
    try {
      const date = formatDate(weekDates[scheduleDay]);
      await onAddToPlan(schedulingRecipe, date, scheduleMeal.toLowerCase());
      setSuccessMsg(`${schedulingRecipe.title} added to ${DAYS[scheduleDay]} ${scheduleMeal}`);
      setStep('review');
    } catch (e) {
      // stay on schedule so user can retry
    } finally {
      setScheduling(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal plan-ai-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>
            <Sparkles size={20} style={{ display: 'inline', marginRight: '0.4rem', color: 'var(--green-primary)' }} />
            Plan with AI
          </h2>
          <p className="modal-description">
            Ask for a recipe, a cuisine, or a day — we'll match your saved recipes and add them to your planner.
          </p>
        </div>

        <hr className="modal-divider" />

        <div className="modal-body">
          {step === 'input' && (
            <>
              {!hasRecipes && (
                <p className="plan-ai-error">You have no saved recipes yet. Add some recipes first.</p>
              )}
              <textarea
                className="form-input form-textarea plan-ai-textarea"
                placeholder="e.g. I want dosa for Monday, something Italian for Tuesday, or quick meals this week"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                autoFocus
                disabled={!hasRecipes}
              />
              {error && <p className="plan-ai-error">{error}</p>}
              <button
                className="modal-cart-btn"
                onClick={handleGenerate}
                disabled={!description.trim() || !hasRecipes}
              >
                <Sparkles size={15} /> Find Matching Recipes
              </button>
            </>
          )}

          {step === 'loading' && (
            <div className="plan-ai-loading">
              <div className="plan-ai-spinner" />
              <p>Finding your best matches...</p>
            </div>
          )}

          {step === 'review' && (
            <>
              <div className="plan-ai-review-header">
                <p className="plan-ai-summary">
                  {matchedRecipes.length > 0
                    ? `${matchedRecipes.length} recipe${matchedRecipes.length !== 1 ? 's' : ''} matched — click one to schedule it`
                    : 'No saved recipes matched your description.'}
                </p>
                <button className="plan-ai-back-btn" onClick={() => setStep('input')}>← Ask again</button>
              </div>

              {successMsg && (
                <div className="plan-ai-success">
                  <Check size={13} /> {successMsg}
                </div>
              )}

              {matchedRecipes.length > 0 && (
                <ul className="plan-ai-recipe-list">
                  {matchedRecipes.map((recipe) => (
                    <li key={recipe.id} className="plan-ai-recipe-item" onClick={() => handleSelectRecipe(recipe)}>
                      <div className="plan-ai-recipe-info">
                        <span className="plan-ai-recipe-title">{recipe.title}</span>
                        <div className="plan-ai-recipe-meta">
                          {recipe.time && <span>{recipe.time}</span>}
                          {recipe.tags?.length > 0 && recipe.tags.map((tag) => (
                            <span key={tag} className="plan-ai-tag">{tag}</span>
                          ))}
                        </div>
                        {recipe.description && <span className="plan-ai-recipe-desc">{recipe.description}</span>}
                      </div>
                      <ChevronRight size={16} className="plan-ai-recipe-arrow" />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 'schedule' && schedulingRecipe && (
            <>
              <div className="plan-ai-review-header">
                <p className="plan-ai-summary">Add to planner</p>
                <button className="plan-ai-back-btn" onClick={() => setStep('review')}>← Back</button>
              </div>

              <p className="plan-ai-schedule-recipe">{schedulingRecipe.title}</p>

              <div className="plan-ai-schedule-section">
                <p className="plan-ai-schedule-label">Day</p>
                <div className="plan-ai-day-picker">
                  {weekDates.map((date, i) => (
                    <button
                      key={i}
                      className={`plan-ai-day-btn ${scheduleDay === i ? 'plan-ai-day-btn--active' : ''}`}
                      onClick={() => setScheduleDay(i)}
                    >
                      <span className="plan-ai-day-name">{DAYS[i]}</span>
                      <span className="plan-ai-day-date">{date.getDate()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="plan-ai-schedule-section">
                <p className="plan-ai-schedule-label">Meal</p>
                <div className="plan-ai-meal-picker">
                  {MEAL_TYPES.map((meal) => (
                    <button
                      key={meal}
                      className={`plan-ai-meal-btn ${scheduleMeal === meal ? 'plan-ai-meal-btn--active' : ''}`}
                      onClick={() => setScheduleMeal(meal)}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>

              <button className="modal-cart-btn" onClick={handleAddToPlan} disabled={scheduling}>
                {scheduling ? 'Adding...' : `Add to ${DAYS[scheduleDay]} ${scheduleMeal}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
