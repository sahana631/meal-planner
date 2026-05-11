import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Sparkles } from 'lucide-react';
import { fetchPlanner, addMealPlan, removeMealPlan } from '../services/api';
import RecipeModal from '../components/RecipeModal';
import PlanWithAI from '../components/PlanWithAI';
import './Planner.css';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function Planner({ recipes, pantry, onAddToCart, onAddDirectToCart, onAddToPantry }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [plans, setPlans] = useState([]);
  const [picking, setPicking] = useState(null);
  const [search, setSearch] = useState('');
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [showPlanAI, setShowPlanAI] = useState(false);
  const [dragOver, setDragOver] = useState(null); // "date|mealType"
  const draggedPlan = useRef(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDates[6];

  useEffect(() => {
    fetchPlanner(formatDate(weekStart), formatDate(weekEnd))
      .then(setPlans)
      .catch(() => {});
  }, [weekStart]);

  function getPlan(date, mealType) {
    return plans.find((p) => p.date === formatDate(date) && p.mealType === mealType.toLowerCase());
  }

  async function handleAdd(recipe) {
    const { date, mealType } = picking;
    const plan = await addMealPlan({ date, mealType: mealType.toLowerCase(), recipeId: recipe.id });
    setPlans((prev) => {
      const filtered = prev.filter((p) => !(p.date === date && p.mealType === mealType.toLowerCase()));
      return [...filtered, plan];
    });
    setPicking(null);
    setSearch('');
  }

  async function handleRemove(plan) {
    await removeMealPlan(plan.id);
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
  }

  async function handleDrop(targetDate, targetMealType) {
    setDragOver(null);
    const source = draggedPlan.current;
    draggedPlan.current = null;
    if (!source) return;

    const tDate = formatDate(targetDate);
    const tMeal = targetMealType.toLowerCase();

    // same cell — no-op
    if (source.date === tDate && source.mealType === tMeal) return;

    const targetPlan = plans.find((p) => p.date === tDate && p.mealType === tMeal);

    if (targetPlan) {
      // swap: put source recipe in target cell, target recipe in source cell
      const [newTarget, newSource] = await Promise.all([
        addMealPlan({ date: tDate, mealType: tMeal, recipeId: source.recipeId }),
        addMealPlan({ date: source.date, mealType: source.mealType, recipeId: targetPlan.recipeId }),
      ]);
      setPlans((prev) =>
        prev
          .filter((p) => p.id !== source.id && p.id !== targetPlan.id)
          .concat([newTarget, newSource])
      );
    } else {
      // move: upsert in new cell, delete old
      const newPlan = await addMealPlan({ date: tDate, mealType: tMeal, recipeId: source.recipeId });
      await removeMealPlan(source.id);
      setPlans((prev) =>
        prev.filter((p) => p.id !== source.id).concat([newPlan])
      );
    }
  }

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const todayStr = formatDate(new Date());
  const isToday = (date) => formatDate(date) === todayStr;
  const isPast = (date) => formatDate(date) < todayStr;

  return (
    <main className="planner-page">
      <div className="planner-header">
        <h1>Meal Planner</h1>
        <div className="planner-header-right">
        <button className="plan-ai-trigger-btn" onClick={() => setShowPlanAI(true)}>
          <Sparkles size={15} /> Plan with AI
        </button>
        <div className="week-nav">
          <button onClick={() => setWeekStart((w) => addDays(w, -7))}><ChevronLeft size={18} /></button>
          <span className="week-label">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekStart((w) => addDays(w, 7))}><ChevronRight size={18} /></button>
          <button className="today-btn" onClick={() => setWeekStart(getMonday(new Date()))}>Today</button>
        </div>
        </div>
      </div>

      <div className="planner-grid">
        <div className="planner-grid-header">
          <div className="meal-type-label" />
          {weekDates.map((date, i) => (
            <div key={i} className={`day-header ${isToday(date) ? 'today' : ''} ${isPast(date) ? 'past' : ''}`}>
              <span className="day-name">{DAYS[i]}</span>
              <span className="day-date">{date.getDate()}</span>
            </div>
          ))}
        </div>

        {MEAL_TYPES.map((mealType) => (
          <div key={mealType} className="planner-row">
            <div className="meal-type-label">{mealType}</div>
            {weekDates.map((date, i) => {
              const plan = getPlan(date, mealType);
              const cellKey = `${formatDate(date)}|${mealType}`;
              const isOver = dragOver === cellKey;
              const past = isPast(date);

              return (
                <div
                  key={i}
                  className={`planner-cell ${isOver ? 'drag-over' : ''} ${past ? 'past' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(cellKey); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop(date, mealType)}
                >
                  {plan ? (
                    <div
                      className="meal-card"
                      draggable
                      onDragStart={() => { draggedPlan.current = plan; }}
                      onDragEnd={() => { draggedPlan.current = null; setDragOver(null); }}
                      onClick={() => {
                        const full = recipes.find((r) => r.id === plan.recipeId);
                        if (full) setViewingRecipe(full);
                      }}
                    >
                      <span className="meal-card-title">{plan.recipe.title}</span>
                      <button
                        className="meal-remove-btn"
                        onClick={(e) => { e.stopPropagation(); handleRemove(plan); }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="meal-add-btn"
                      onClick={() => { setPicking({ date: formatDate(date), mealType }); setSearch(''); }}
                    >
                      <Plus size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {showPlanAI && (
        <PlanWithAI
          recipes={recipes}
          pantry={pantry}
          onAddToPlan={async (recipe, date, mealType) => {
            const plan = await addMealPlan({ date, mealType, recipeId: recipe.id });
            setPlans((prev) => [
              ...prev.filter((p) => !(p.date === date && p.mealType === mealType)),
              plan,
            ]);
          }}
          onClose={() => setShowPlanAI(false)}
        />
      )}

      {viewingRecipe && (
        <RecipeModal
          recipe={viewingRecipe}
          pantry={pantry}
          onClose={() => setViewingRecipe(null)}
          onAddToCart={onAddToCart}
          onAddToPantry={onAddToPantry}
        />
      )}

      {picking && (
        <div className="recipe-picker-overlay" onClick={() => setPicking(null)}>
          <div className="recipe-picker" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-picker-header">
              <h3>Pick a recipe</h3>
              <button onClick={() => setPicking(null)}><X size={18} /></button>
            </div>
            <input
              className="recipe-picker-search form-input"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <ul className="recipe-picker-list">
              {filteredRecipes.map((r) => (
                <li key={r.id} className="recipe-picker-item" onClick={() => handleAdd(r)}>
                  <span className="recipe-picker-title">{r.title}</span>
                  <span className="recipe-picker-time">{r.time}</span>
                </li>
              ))}
              {filteredRecipes.length === 0 && (
                <li className="recipe-picker-empty">No recipes found</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
